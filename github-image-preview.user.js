// ==UserScript==
// @name          Github image preview
// @description   Allow README images to be previewed on full monitor size
// @author        Aziks
// @version       1.1
// @homepageURL   https://github.com/Aziks0/github-image-preview
// @downloadURL   https://github.com/Aziks0/github-image-preview/raw/release/github-image-preview.user.js
// @license       GPLv3
// @run-at        document-idle
// @match         https://github.com/*/*
// @grant         none
// ==/UserScript==

/**
 * Add a style element to the page
 *
 * @param {string} styles CSS styles
 */
const addStyles = (styles) => {
  const styleElement = document.createElement('style');
  styleElement.appendChild(document.createTextNode(styles));
  document.head.appendChild(styleElement);
};

/**
 * Remove the `z-index` style from the README navbar
 */
const removeReadmeNavbarZindex = () => {
  const readme = document.getElementById('readme');
  const navbar = readme.firstElementChild;
  const oldStyle = navbar.getAttribute('style');
  const style = oldStyle.replace(/z-.*;/, ''); // Remove `z-index: xx;`
  navbar.setAttribute('style', style);
};

/**
 * Get all the image elements from the README
 *
 * @returns The image elements contained in the README
 */
const getImageElements = () => {
  const readme = document.getElementById('readme');
  const article = readme.getElementsByTagName('article')[0];
  return article.getElementsByTagName('img');
};

/**
 * Filter the image elements that are not linked to images
 *
 * @param {HTMLImageElement[]} imageElements
 *
 * @returns An array containing image elements that are linked to image
 */
const filterRepoImageElements = (imageElements) => {
  return imageElements.filter((imageElement) => {
    const link = imageElement.parentElement.getAttribute('href');
    if (!link) return false;
    return (
      link.includes('githubusercontent.com') ||
      link.match('/blob/.*\\.(png|jpe?g)$')
    );
  });
};

/**
 * Create a portal element
 *
 * @returns A portal element
 */
const createPortal = () => {
  const closeOnClick = (event) => {
    const element = event.target;
    if (element.id !== 'gip-overlay-container') return;
    togglePortal(false);
  };

  const background = document.createElement('div');
  background.classList.add('gip-overlay-background', 'gip-fixed');

  const container = document.createElement('div');
  container.classList.add('gip-overlay-container', 'gip-fixed');
  container.setAttribute('id', 'gip-overlay-container');
  container.addEventListener('click', closeOnClick);

  const portal = document.createElement('div');
  portal.classList.add('gip-portal');
  portal.setAttribute('style', 'display: none;');
  portal.setAttribute('id', 'gip-portal');
  portal.appendChild(background);
  portal.appendChild(container);

  return portal;
};

/**
 * Add a portal to the page
 */
const addPortalToPage = () => {
  const styles = `
  .gip-portal {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
  }

  .gip-fixed {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  
  .gip-overlay-background {
    background-color: rgba(30, 30, 30, .7);
  }
  
  .gip-overlay-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }`;

  addStyles(styles);

  const portal = createPortal();
  document.body.appendChild(portal);
};

/**
 * Toggle the portal
 *
 * @param {boolean} display
 */
const togglePortal = (display) => {
  const style = display ? '' : 'display: none';
  const portal = document.getElementById('gip-portal');
  portal.setAttribute('style', style);
};

/**
 * Add an image element to portal, the previous content of the portal is removed
 *
 * @param {string} source The image source URL
 */
const addImageToPortal = (source) => {
  const image = document.createElement('img');
  image.setAttribute('src', source);
  image.classList.add('gip-image-preview');

  // Replace content with the new image
  const overlay = document.getElementById('gip-overlay-container');
  overlay.innerHTML = '';
  overlay.appendChild(image);
};

/**
 * Get the raw url of an image
 *
 * @param {HTMLAnchorElement} anchor
 *
 * @returns The raw url of the image
 */
const getRawImageUrl = (anchor) => {
  const url = anchor.href;
  if (url.includes('githubusercontent.com')) return url; // We already have the raw URL

  // Otherwise the raw URL is contained in the child image element source
  return anchor.firstElementChild.getAttribute('src');
};

/**
 * Add a click event listener to all the images from `imageElements`. When an event is
 * triggered, the image from `imageElements` is added to the portal and the
 * portal is shown
 *
 * @param {HTMLImageElement[]} imageElements An array containing image elements
 */
const setOnClickOnImageEvent = (imageElements) => {
  /** @param {MouseEvent} event */
  const onClick = (event) => {
    event.preventDefault();

    /** @type {HTMLImageElement} */
    const image = event.target;
    const url = getRawImageUrl(image.parentElement);
    addImageToPortal(url);
    togglePortal(true);
  };

  imageElements.forEach((imageElement) => {
    const parent = imageElement.parentElement;
    parent.addEventListener('click', onClick);
  });
};

const main = () => {
  const unfilteredImageElements = getImageElements();
  if (!unfilteredImageElements) return;

  const imageElements = filterRepoImageElements(
    Array.from(unfilteredImageElements)
  );
  setOnClickOnImageEvent(imageElements);

  addPortalToPage();
  removeReadmeNavbarZindex();

  const styles = `
  .gip-image-preview {
    max-width: 90%;
    max-height: 90%;
  }`;
  addStyles(styles);
};

main();
