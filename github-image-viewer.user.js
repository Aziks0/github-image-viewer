// ==UserScript==
// @name          Github image viewer
// @description   View readme/issues/PR images in full screen, w/o leaving the page
// @author        Aziks
// @version       1.4
// @homepageURL   https://github.com/Aziks0/github-image-viewer
// @downloadURL   https://github.com/Aziks0/github-image-viewer/raw/release/github-image-viewer.user.js
// @license       GPL-3.0-or-later
// @run-at        document-idle
// @match         https://github.com/*/*
// @require       https://unpkg.com/feather-icons
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
 * Get the README element
 *
 * @returns The README element, or null if it doesn't exist
 */
const getReadmeElement = () => document.getElementById('readme');

/**
 * Get the discussion element. It's present on issue, pull request and
 * discussion pages.
 *
 * @returns The discussion element, or null if it doesn't exist
 */
const getDiscussionElement = () =>
  document.querySelector('#discussion_bucket .js-discussion');

const isReadmePage = () => (getReadmeElement() ? true : false);

const isDiscussionPage = () => (getDiscussionElement() ? true : false);

/**
 * Get all the image elements from the README
 *
 * @returns The image elements contained in the README
 */
const getReadmeImageElements = () => {
  const readme = getReadmeElement();
  const article = readme.getElementsByTagName('article')[0];
  return article.getElementsByTagName('img');
};

/**
 * Get all the image elements from issue, pull request and discussion pages
 *
 * @returns The image elements contained in issue, pull request or discussion page
 */
const getDiscussionImageElements = () => {
  const discussion = getDiscussionElement();
  return discussion.getElementsByTagName('img');
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
      link.match('/(blob|raw)/.*\\.(png|jpe?g|gif)(\\?.*)?$')
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
    z-index: 499;
  }
  
  .gip-overlay-container {
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 500;
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
  image.classList.add('gip-image-viewer');

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
 * Add a click event listener to all the images from
 * `imageElements`. When the event is triggered, the image from `imageElements`
 * is added to the portal and the portal is shown.
 *
 * Add a CSS class that display an icon on hover.
 *
 * @param {HTMLImageElement[]} imageElements An array containing image elements
 */
const setImagesEvents = (imageElements) => {
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
    parent.classList.add('gip-image-container');
    parent.addEventListener('click', onClick);

    const icon = document.createElement('i');
    icon.setAttribute('data-feather', 'maximize-2');
    icon.classList.add('gip-image-maximize-icon');
    parent.appendChild(icon);
  });
};

const main = () => {
  /** @type {HTMLCollectionOf<HTMLImageElement>} */
  let unfilteredImageElements;
  if (isReadmePage()) {
    unfilteredImageElements = getReadmeImageElements();
  } else if (isDiscussionPage()) {
    unfilteredImageElements = getDiscussionImageElements();
  }

  if (!unfilteredImageElements) return;

  const imageElements = filterRepoImageElements(
    Array.from(unfilteredImageElements)
  );
  setImagesEvents(imageElements);

  feather.replace();
};

const globalStyles = `
.gip-image-viewer {
  max-width: 90%;
  max-height: 90%;
}
.gip-image-container {
  position: relative;
}
.gip-image-maximize-icon {
  display: none;
  position: absolute;
  height: 18px;
  width: 18px;
  top: -6px;
  right: 4px;
  color: white;
  background-color: #00000070;
}
.gip-image-container:hover .gip-image-maximize-icon {
  display: inline-block;
}
`;
addStyles(globalStyles);
addPortalToPage();

main();

document.addEventListener('pjax:success', main);
