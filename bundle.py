from __future__ import absolute_import
from __future__ import print_function
#!/usr/bin/env python
# -*- coding: utf-8 -*-
import numpy as np
import pyopencl as cl
import pyopencl.array
from pyopencl.elementwise import ElementwiseKernel

import math
import random # just for some tests

print("make context:")
ctx = cl.create_some_context(interactive=False)
print("make queue: ")
queue = cl.CommandQueue(ctx)
print("build program:")
prg = cl.Program(ctx, """
__kernel void outer(__global float* x, __global float* y, __global const float* l, __global float* f, int n, float maxstep)
{
    int i = get_global_id(0);
    if (i >= n){return;}
    if (l[i] == 1){return;}
    float fx = 0;
    float fy = 0;
    for(uint j=0; j<16; j+=1) // powers of two let me use a speed-up in another portion
    {
        fx = fx + f[j*(2*n)+i]; // collates the x and y forces from the other 10 blocks (f must be 2*16*n long)
        fy = fy + f[j*(2*n)+n+i];
    }
    float a = rsqrt(fx*fx + fy*fy + 1.0);
    x[i] = x[i] + fx * maxstep*a;  y[i] = y[i] + fy * maxstep*a;
    return;
}


__kernel void inner(__global float* x, __global float* y, __global const float* l, __global float* f, int n, float k) 
{
    int i = get_global_id(0);
    int width = (n >> 4) + 1; // the width of a block, i.e. a limit for how far we should iterate
    int w = get_global_id(1);
    f[w*(2*n)+i] = 0;  f[w*(2*n)+n+i] = 0; // clear any data that might already be here
    if (i >= n){return;}
    if (l[i] == 1){return;}
    float fx = k*(x[i-1]+x[i+1]-2*x[i]);// * (fabs(x[i-1]-x[i]) + fabs(x[i+1]-x[i]))*0.02;
    float fy = k*(y[i-1]+y[i+1]-2*y[i]);// * (fabs(y[i-1]-y[i]) + fabs(y[i+1]-y[i]))*0.02;
    int lower = w*width + 1;
    int higher = min((w+1)*width + 1, n);
    float ix = x[i+1]-x[i-1]; float iy = y[i+1]-y[i-1];
    float q = rsqrt(ix*ix + iy*iy + 1.0 );
    //return; // some error is happening after here, with memory access

    for(uint j=lower; j<higher; j+=1)
    {
        float jx = x[j+1]-x[j-1]; float jy = y[j+1]-y[j-1]; // length and angle information for j
        float a = jx*ix + jy*iy; // dot product if i and j
        float dx = x[j] - x[i];  float dy = y[j] - y[i];
        float d = dx*dx + dy*dy;
        // currently doing a lot of work in this area, tuning the bundling force strategy
        float m = pow(25.0+d, -1.6) * q * fabs(a);
        fx = fx + m*dx*(1-l[j]);
        fy = fy + m*dy*(1-l[j]);
    }
    f[w*(2*n)+i] = fx;  f[w*(2*n)+n+i] = fy;
    return;
}
__kernel void inner_directed(__global float* x, __global float* y, __global const float* l, __global float* f, int n, float k) 
{
    int i = get_global_id(0);
	int width = (n >> 4) + 1; // the width of a block, i.e. a limit for how far we should iterate
	int w = get_global_id(1);
	f[w*(2*n)+i] = 0;  f[w*(2*n)+n+i] = 0; // clear any data that might already be here
    if (i >= n){return;}
    if (l[i] == 1){return;}
	//float fx = k*(x[i-1]+x[i+1]-2*x[i]);
	//float fy = k*(y[i-1]+y[i+1]-2*y[i]);
	float fx = k*(x[i-1]+x[i+1]-2*x[i]);// * (fabs(x[i-1]-x[i]) + fabs(x[i+1]-x[i]))*0.02;
	float fy = k*(y[i-1]+y[i+1]-2*y[i]);// * (fabs(y[i-1]-y[i]) + fabs(y[i+1]-y[i]))*0.02;

	int lower = w*width + 1;
	int higher = min((w+1)*width + 1, n);
	float ix = x[i+1]-x[i-1]; float iy = y[i+1]-y[i-1];
	float q = rsqrt(ix*ix + iy*iy + 1.0);

	for(uint j=lower; j<higher; j+=1)
	{
		float jx = x[j+1]-x[j-1]; float jy = y[j+1]-y[j-1]; // length and angle information for j
		float a = jx*ix + jy*iy; // dot product of i and j.
		 // same direction attraction
		float dx = x[j] - x[i];  float dy = y[j] - y[i];
		float d = dx*dx + dy*dy;
		float m = max( (float) a,  (float) 0.0)  * pow(35.0+d, -1.6);
		m = m*q;
		fx = fx + m*dx*(1-l[j]);  fy = fy + m*dy*(1-l[j]);
		// opposite direction nearby attraction, off to the side
		float v = rsqrt(jx*jx + jy*jy + 0.1 );
		dx = x[j] - x[i] + (25*jy)*v;  dy = y[j] - y[i] - (25*jx)*v;
		d = dx*dx + dy*dy;
		m = max( (float) -a, (float) 0.0)  * pow(35.0+d, -1.6);
		m = m*q;
		fx = fx + m*dx*(1-l[j]);  fy = fy + m*dy*(1-l[j]);
	}
	f[w*(2*n)+i] = fx;  f[w*(2*n)+n+i] = fy;
	return;
}
""").build()
ORDER = [4, 3.0, 2.5, 2.0, 1.5, 1.0]

def bundle(L, X, Y, K, H, dir=False):
    if len(L) < 3: return [[float(i) for i in X], [float(i) for i in Y]]  # sanity check
    Lg = np.array(L).astype(np.float32)
    Xg = np.array(X).astype(np.float32)
    Yg = np.array(Y).astype(np.float32)
    Fg = np.empty(len(L)*32, dtype=np.float32)
    # create the buffers to hold the values of the input
    Lb = cl.array.to_device(queue, Lg)
    Xb = cl.array.to_device(queue, Xg)
    Yb = cl.array.to_device(queue, Yg)
    Fb = cl.array.to_device(queue, Fg)
    for maxstep in ORDER:
        if dir:
            inner = prg.inner_directed # inner, directional
        else:
            inner = prg.inner  # inner, non-directional
        inner.set_scalar_arg_dtypes([None, None, None, None, np.int32, np.float32])
        inner(queue, [len(L), 16], None, Xb.data, Yb.data, Lb.data, Fb.data, np.int32(len(L)), K)
        outer = prg.outer  # outer
        outer.set_scalar_arg_dtypes([None, None, None, None, np.int32, np.float32])
        outer(queue, [len(L)], None, Xb.data, Yb.data, Lb.data, Fb.data, np.int32(len(L)), 4*math.exp(H)*maxstep)
    X = Xb.get()
    Y = Yb.get()
    return [[float(i) for i in X], [float(i) for i in Y]]

print("bundler compiled")
