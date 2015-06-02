// ==UserScript==
// @name        Twitter Style Changer
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Changes tweets' style on user pages of Twitter
// @version     3.0
// @include     https://twitter.com/*
// @exclude     https://twitter.com/
// @exclude     https://twitter.com/search?*
// @grant       GM_registerMenuCommand
// ==/UserScript==
(function () {
  'use strict';

  var headerImgUrl = document.querySelector('[class="ProfileCanopy-headerBg"]')
        .childNodes[1]
        .getAttribute('src'),
      openUsrHeaderImg = function () {
        window.open(headerImgUrl);
      },
      changeUserPageStyle = function (addedTweets) {
        var userTweets = !!addedTweets ?
            [].slice.call(addedTweets.addedNodes) :
            [].slice.call(document.querySelectorAll('[data-item-type="tweet"]'));

        userTweets.forEach(function (targetNode) {
          var tweetFrame = targetNode.childNodes[1],
              tweetContext,
              nodeListSize;

          // destroy follow entry!
          if (targetNode.getAttribute('data-item-type') === 'follow_entry') {
            targetNode.style.display = 'none';
            return;
          }

          // the tweet is fixed tweet or retweet
          if (tweetFrame.tagName === 'OL') {
            tweetFrame = tweetFrame.childNodes[1].childNodes[1];
          }

          tweetContext = tweetFrame.childNodes[3];
          nodeListSize = tweetContext.childNodes.length;

          tweetContext.childNodes[nodeListSize - 2].style.marginBottom = '-7px';
          tweetContext.childNodes[nodeListSize - 2].childNodes[7].style.marginTop = '-7px';

          // quoted tweet
          if (nodeListSize > 14) {
            tweetContext.childNodes[5].style.fontSize = '12px';
            tweetContext.childNodes[5].style.lineHeight = '18px';
          } else {
            tweetContext.childNodes[3].style.fontSize = '12px';
            tweetContext.childNodes[3].style.lineHeight = '18px';
          }

          [].forEach.call(
            targetNode.querySelectorAll('[class="twitter-timeline-link"]'),
            function (linkNode) {
              if (linkNode.hasAttribute('title')) {
                linkNode.setAttribute('href', linkNode.getAttribute('title'));
              }

              linkNode.setAttribute('target', '_blank');
            }
          );
        });
      },
      userProfLink = document.querySelector('[class="u-textUserColor"]'),
      // MutationObserver
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      observer = new MutationObserver(function (mutations) {
        mutations.forEach(changeUserPageStyle);
      });

  GM_registerMenuCommand('Open this header image', openUsrHeaderImg);

  if (!!userProfLink) {
    userProfLink.setAttribute('href', userProfLink.getAttribute('title'));
  }

  observer.observe(
    document.getElementById('stream-items-id'), {childList: true }
  );

  changeUserPageStyle();
})();