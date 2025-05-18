/**
 * @brief                   Converts a local JavaScript Date object to a UTC Date object
 * @param {Date} localDate  The local Date object to convert
 * @returns {Date | null}   A new Date object representing the same date in UTC, or null if input is invalid
 */
export function toUTC(localDate) {
    if (!isValidDateObject(localDate)) return null;
    return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
}

/**
 * @brief                   Adds a specified number of months to a UTC Date object
 * @param {Date} utcDate    The UTC Date object
 * @param {number} months   The number of months to add
 * @returns {Date | null}   A new Date object with the months added, or null if input is invalid
 */
export function addMonthsUTC(utcDate, months) {
    if (!isValidDateObject(utcDate)) return null;
    const newDate = new Date(utcDate.getTime());
    newDate.setUTCMonth(newDate.getUTCMonth() + months);
    return newDate;
}

/**
 * @brief                   Subtracts a specified number of years from a UTC Date object
 * @param {Date} utcDate    The UTC Date object
 * @param {number} years    The number of years to subtract
 * @returns {Date | null}   A new Date object with the years subtracted, or null if input is invalid
 */
export function subtractYearsUTC(utcDate, years) {
    if (!isValidDateObject(utcDate)) return null;
    const newDate = new Date(utcDate.getTime());
    newDate.setUTCFullYear(newDate.getUTCFullYear() - years);
    return newDate;
}

/**
 * @brief               Check if date is valid
 * @param {Date} date   The date object
 * @returns {boolean}   True if valid, false otherwise
 */
export function isValidDateObject(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * @brief               Helper function to check if a year is a leap year
 * @param {number} year The year to check
 * @returns {boolean}   True if it's a leap year, false otherwise
 * @private
 */
function _isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * @brief                   Helper function to get the number of days in a specific month of a year
 * @param {number} year     The year
 * @param {number} month    The month (1-12)
 * @returns {number}        The number of days in the month
 * @private
 */
function _getDaysInMonth(year, month) {
    if (month === 2) return _isLeapYear(year) ? 29 : 28;
    if ([4, 6, 9, 11].includes(month)) return 30;
    return 31;
}

/**
 * @brief                   Parse date string to Date object with proper day/month validation for YYYY-MM-DD
 * @param {string} value    The date string (expected primarily as YYYY-MM-DD)
 * @returns {Date | null}   The parsed local Date object or null if invalid or format is not YYYY-MM-DD
 */
export function parseDate(value) {
    if (!value) return null;

    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const parts = value.match(isoPattern);

    if (parts) {
        const year = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10);
        const day = parseInt(parts[3], 10);
        if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
        const daysInActualMonth = _getDaysInMonth(year, month);
        if (day > daysInActualMonth) return null;

        return new Date(year, month - 1, day);
    }

    console.warn(`parseDate: Input \`${value}\` is not in YYYY-MM-DD format or is invalid. Strict parsing returning null.`);
    return null;
}

/**
 * @brief               Formats a date as DD/MM/YYYY
 * @param {Date} date   The date to format
 * @throws {TypeError}  If the input is not a valid Date object
 * @returns {string}    The formatted date string in DD/MM/YYYY format, or an empty string if the date is invalid
 */
export function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB');
}
