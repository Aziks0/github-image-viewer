// ==UserScript==
// @name          github-image-preview
// @description   Allow README images to be previewed on full monitor size
// @author        Aziks
// @version       1.0
// @license       GPLv3
// @run-at        document-idle
// @match         https://github.com/*/*
// @grant         none
// ==/UserScript==

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

};

