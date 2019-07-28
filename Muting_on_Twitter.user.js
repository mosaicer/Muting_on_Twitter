// ==UserScript==
// @name        Muting on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Mutes texts/links/tags/userIDs on Twitter
// @version     8.4
// @match       https://twitter.com/home
// @match       https://twitter.com/
// run-at       document-idle
// ==/UserScript==
(() => {
  'use strict';

  const isContainerOfTweetHeader =
    function checkIfTheNodeContainsHeaderOfTweets(node) {
      return node.querySelector('[aria-label="トップツイートがオフになります"]');
    };

  const createAndAddFormForMuting =
    function createAndAddFormNodeToConfigureSettingToMuteTweets(parentOfHeader) {
      console.log(parentOfHeader);

      // TODO: create nodes programmatically and set event listeners to them
    };

  const isContainerOfTweetNodes =
    function checkIfTheNodeContainsParentNodeOfTweetNodes(node) {
      return node.querySelector('[aria-label="タイムライン: ホームタイムライン"]');
    };

  const observeNewTweets =
    function startObservingTheTweetsThatSystemAdds(parentOfTweetNodes) {
      new MutationObserver(mutations =>
        mutations.forEach(mutation =>
          mutation.addedNodes.forEach(muteIfNeed)
        )
      ).observe(parentOfTweetNodes, { childList: true });
    };

  const muteIfNeed = function tryToHideTweetNode(node) {
    const tweetNode = node.querySelector('[data-testid="tweet"]');
    console.log(tweetNode);

    if (tweetNode && needToMute(tweetNode)) {
      node.style.display = 'none';
    }
  };

  const needToMute = function checkIfTweetNodeNeedsTobeMuted(tweetNode) {
    if (isPromotion(tweetNode)) return true;

    return false;
  };

  const isPromotion = function checkIfTweetNodeIsPromotion(tweetNode) {
    // MEMO: it's difficult to find the text "Promotion" simply
    // MEMO: it's easy to find the icon that indicates promotion, but I think that the icon easily changes
    return tweetNode.children[1].children.length === 3;
  };

  // observe events that nodes are added in/removed from the root node or its subtree
  const rootNode = document.getElementById('react-root');
  new MutationObserver(mutations =>
    mutations.forEach(mutation =>
      mutation.addedNodes.forEach(node => {
        if (isContainerOfTweetHeader(node)) {
          console.log(node);

          const parentOfHeader = node.children[0].children[0];
          createAndAddFormForMuting(parentOfHeader);
        }

        if (isContainerOfTweetNodes(node)) {
          console.log(node);

          const parentOfTweetNodes =
            node.querySelector('[aria-label="タイムライン: ホームタイムライン"]').children[0].children[0];

          parentOfTweetNodes.childNodes.forEach(muteIfNeed);

          observeNewTweets(parentOfTweetNodes);
        }
      })
    )
  ).observe(rootNode, { childList: true, subtree: true });
})();
