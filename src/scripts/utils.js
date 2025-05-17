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
 * @brief                       Hide the element
 * @param { string } selector   The selector string
 * @returns { void }            Sets the display style to none
 */
export function hide(selector) {
    if (selector) selector.style.display = "none";
}

/**
 * @brief                       Add an event listener to the element
 * @param { string } container  The container selector string
 * @param { string } event      The event string
 * @param { string } selector   The selector string
 * @param { function } handler  The handler function
 * @returns { void }            Adds the event listener to the container
 */
export function on(container, event, selector, handler) {
    const c = qs(container);

    if (!c) return;

    c.addEventListener(event, (e) => {
        if (e.target.matches(selector)) handler(e);
    });
}
