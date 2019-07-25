// ==UserScript==
// @name        Muting on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Mutes texts/links/tags/userIDs on Twitter
// @version     8.4
// @match       https://twitter.com/home
// run-at       document-idle
// ==/UserScript==
(() => {
  'use strict';

  const isContainerOfTweetNodes =
    function checkIfTheNodeContainsParentNodeOfTweetNodes(node) {
      return node.querySelector('[aria-label="タイムライン: ホームタイムライン"]');
    };

  // observe events that nodes are added in/removed from the root node or its subtree
  const rootNode = document.getElementById('react-root');
  new MutationObserver(mutations =>
    mutations.forEach(mutation =>
      mutation.addedNodes.forEach(node => {
        if (isContainerOfTweetNodes(node)) {
          console.log(node);
        }
      })
    )
  ).observe(rootNode, { childList: true, subtree: true });
})();
