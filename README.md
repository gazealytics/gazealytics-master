# Gazealytics: A Unified and Flexible Visual Toolkit for Exploratory and Comparative Gaze Analysis

## Introduction

Gazealytics is a sophisticated, web-based visual eye tracking analytics toolkit that features a unified combination of gaze analytics features that support flexible exploratory analysis, along with annotation of areas of interest (AOI), time-window of interest (TWI) and filter options based on multiple criteria to visually analyse eye tracking data across time and space. 

Gazealytics features coordinated views unifying spatiotemporal exploration of fixations, saccades and scanpaths for various analytical tasks. It aims to help eye tracking analysts to interactively explore eye tracking data. It allows analysts to visualize their data in various granuarlarity in overview, group, and individual level. Data can be grouped across samples, user-defined AOIs or TWIs to support aggregate or filtered analysis of gaze activity.

It supports a flexible interface for integration into analysts' existing workflow. User-defined samples, AOIs, and TWIs can be imported, where visual metrics results and their coordinated visualizations can be explored on the fly. The interface allows for exporting and restoring snapshot of analysis such as multicriteria parameters, AOIs, metrics, visualizations, and text annotation for post-analysis as well as for reporting purposes.

A live instance can be found at https://www2.visus.uni-stuttgart.de/gazealytics/.

## Citation
Chen, K. T., Prouzeau, A., Langmead, J., Whitelock-Jones, R. T., Lawrence, L., Dwyer, T., ... & Goodwin, S. (2023). *Gazealytics: A Unified and Flexible Visual Toolkit for Exploratory and Comparative Gaze Analysis.* arXiv preprint [arXiv:2303.17202](https://arxiv.org/pdf/2303.17202.pdf).

Please reference using the reference below:

@article{chen2023gazealytics,
  title={Gazealytics: A Unified and Flexible Visual Toolkit for Exploratory and Comparative Gaze Analysis},
  author={Chen, Kun-Ting and Prouzeau, Arnaud and Langmead, Joshua and Whitelock-Jones, Ryan T and Lawrence, Lee and Dwyer, Tim and Hurter, Christophe and Weiskopf, Daniel and Goodwin, Sarah},
  journal={arXiv preprint arXiv:2303.17202},
  year={2023}
}

## Requirements
  * This repository
  * Python 3.5 or above (web server scripting)

## Tutorial

## Visualizations
The examples below are meant to showcase Gazealytics's capabilities as a unified and flexible visual eye tracking analytics toolkit. It is ready to be integrated into users' existing data analysis workflow.

![IMAGE ALT TEXT](/images/multiway_exploration.PNG)
An exploration can begin at any stage of multi-way visual exploration (a-f) and move between them as shown by arrows. 
    
![IMAGE ALT TEXT](/images/webveta.png)
Multiple coordinated views of (a) data management panel; (b) spatial panel; (c) parameter control panel; (d) metric panel; (e) timeline panel.
The flexible user interface helps users to perform visual analysis across multiple eye tracking analytical tasks. 

![IMAGE ALT TEXT](/images/stat_integration.PNG)
Analytical results can be easily exported and integrated into users' own statistical testing pipeline.

![IMAGE ALT TEXT](/images/realtime_visual_metrics.PNG)
Visual support of interactive exploration of AOIs. The coordinated views of spatial panel, quantitative visual metrics, and AOI sequence chart helps a user to find a more suitable AOI definition. 

## Development
To run Gazealytics from its source code simply run the following:

Download and install [miniconda](https://docs.conda.io/en/latest/miniconda.html)
```
conda install -c conda-forge ujson 
conda install -c conda-forge py 
conda install -c conda-forge numpy
conda install -c conda-forge pyopencl 
conda install -c conda-forge pocl
<the path to python3.7 binary> <the path to server.py>
```

This starts a server in development mode at http://localhost:8080/.
pyopencl is not required unless working with saccade bundling visualisations

## Examples

## Team 
The toolkit is developed by:
  * Kun-Ting Chen (University of Stuttgart)
  * Joshua Langmead (Monash University)
  * Yao Wang (University of Stuttgart)
  * Sarah Goodwin (Monash University)

Past developers:
  * Ishwari Bhade (Monash University)
  * Ryan T Whitelock-Jones (Monash University)

## License
Gazealytics is provided under the MIT License.
