function calculateTimeDifference(dateStr1, dateStr2) {
	const parseDate = (dateStr) => {
		const [day, month, year, time] = dateStr.split(/[\/\s]/);
		const [hours, minutes, seconds] = time.split(":");
		return new Date(year, month - 1, day, hours, minutes, seconds);
	};

	const date1 = parseDate(dateStr1);
	const date2 = parseDate(dateStr2);

	const differenceInMilliseconds = Math.abs(date2 - date1);

	const hours = Math.floor(differenceInMilliseconds / 3600000);
	const minutes = Math.floor((differenceInMilliseconds % 3600000) / 60000);
	const seconds = Math.floor((differenceInMilliseconds % 60000) / 1000);
	const milliseconds = differenceInMilliseconds % 1000;

	const formatted = [
		String(hours).padStart(2, "0"),
		String(minutes).padStart(2, "0"),
		String(seconds).padStart(2, "0"),
		String(milliseconds).padStart(3, "0"),
	].join(":");

	return formatted;
}

function calculateTimeDifferenceInMs(dateStr1, dateStr2) {
    const parseDate = (dateStr) => {
        const [day, month, year, time] = dateStr.split(/[\/\s]/);
        const [hours, minutes, seconds] = time.split(":");
        return new Date(year, month - 1, day, hours, minutes, seconds);
    };

    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);

    return Math.abs(date2 - date1);
}

function convertToMilliseconds(timestamp) {
	let parts = timestamp.split(":").map(Number);
	while (parts.length < 4) {
		parts.push(0);
	}

    let [hours, minutes, seconds, milliseconds] = parts;
    return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
}