/**
 * @brief                       Query selector wrapper
 * @param { string } selector   The selector string
 * @returns { Element | null }  The first matching element or null if not found
 */
export function qs(selector) {
    return document.querySelector(selector);
}

/**
 * @brief                       Query selector all wrapper
 * @param { string } selector   The selector string
 * @returns { NodeList }        All matching elements
 */
export function qsa(selector) {
    return document.querySelectorAll(selector);
}

/**
 * @brief                                   Show the element, defaults to "block"
 * @param { string } element                The element string
 * @param { string } [displayType='block']  The display type string
 */
export function showElement(element, displayType = "block") {
    if (element) element.style.display = displayType;
}

/**
 * @brief                       Hide the element
 * @param { string } element    The element string
 * @returns { void }            Sets the display style to none
 */
export function hideElement(element) {
    if (element) element.style.display = "none";
}

/**
 * @brief                                   Add an event listener to the element
 * @param { HTMLElement | null } container  The container selector string
 * @param { string } eventType              The type of event
 * @param { string } selector               The selector ofor target element
 * @param { Function } handler              The handler function
 * @returns { void }                        Adds the event listener to the container
 */
export function on(container, eventType, selector, handler) {
    if (!container) {
        console.error("Container not found for event binding.");
        return;
    }
    container.addEventListener(eventType, (event) => {
        const targetElement = event.target;

        if (
            targetElement &&
            typeof targetElement.matches === "function" &&
            targetElement.matches(selector)
        )
            handler(event);
    });
}

/**
 * @brief                   Parse date string to Date object
 * @param {string} value    The date string
 * @returns {Date | null}   The parsed Date object or null if invalid
 */
export function parseDate(value) {
    if (!value) return null;

    const d = new Date(value);

    return isNaN(d.getTime()) ? null : d;
}

/**
 * @brief               Check if date is valid
 * @param {Date} date   The date object
 * @returns {boolean}   True if valid, false otherwise
 */
function isValidDateObject(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * @brief                   Convert date to UTC
 * @param {Date} date       The date object
 * @returns {Date | null}   The UTC date or null if invalid
 */
export function toUTC(date) {
    if (!isValidDateObject(date)) {
        console.error("Invalid date provided to toUTC:", date);
        return null;
    }
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
}

/**
 * @brief                   Add months to date
 * @param {Date} dateUTC    The date object
 * @param {number} n        The number of months to add
 * @returns {Date | null}   The date object or null if invalid
 */
export function addMonthsUTC(dateUTC, n) {
    if (!isValidDateObject(dateUTC)) return null;

    const d = new Date(dateUTC.getTime());
    d.setUTCMonth(d.getUTCMonth() + n);

    return d;
}

/**
 * @brief                   Subtract years from date
 * @param {Date} dateUTC    The date object
 * @param {number} n        The number of years to subtract
 * @returns {Date | null}   The date object or null if invalid
 */
export function subtractYearsUTC(dateUTC, n) {
    if (!isValidDateObject(dateUTC)) return null;

    const d = new Date(dateUTC.getTime());
    d.setUTCFullYear(d.getUTCFullYear() - n);

    return d;
}

/**
 * @brief                       Validate date inputted, error message if invalid
 * @param {string} inputValue   The date string
 * @returns {Object}            The date object or null if invalid
 */
function _validateAndParseDate(inputValue) {
    const dateValue = parseDate(inputValue);

    if (dateValue) return { date: dateValue };

    return { date: null };
}

/**
 * @brief                                   Validate date inputted, error message if invalid
 * @param {HTMLInputElement} inputElement   The date input HTML element
 * @returns {Date | null}                   The parsed and validated Date object or null if validation fails
 */
export function requireDateInput(inputElement) {
    if (!inputElement) {
        console.error("Input element not provided to requireDateInput");
        return null;
    }

    if (!inputElement.value) return null;

    const validationResult = _validateAndParseDate(inputElement.value);

    if (validationResult.error) return null;

    return validationResult.date;
}