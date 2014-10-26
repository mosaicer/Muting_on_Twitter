// ==UserScript==
// @name        Twitter Style Changer
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Changes tweets' style on user pages of Twitter
// @version     2.4
// @include     https://twitter.com/*
// @exclude     https://twitter.com/
// @exclude     https://twitter.com/search?*
// @grant       GM_registerMenuCommand
// ==/UserScript==
(function () {
  "use strict";

  var openUsrHeaderImg = function (imgUrl) {
        window.open(imgUrl);
      },
      userPageStyleChange = function (addedTweets) {
        var userTweets = "",
            // all links
            link = Array.prototype.slice.call(document.querySelectorAll("[class='twitter-timeline-link']")),
            // a url of header img
            headerImgUrl,
            // the link of the bottom of user profile
            userProfLink;

        if (typeof addedTweets !== "undefined") {
          userTweets = Array.prototype.slice.call(addedTweets);
        }
        // call at first
        else {
          //
          headerImgUrl = document.querySelector("div[class='ProfileCanopy-headerBg']").childNodes[1].getAttribute("src");
          GM_registerMenuCommand("Open this header image", openUsrHeaderImg.bind(null, headerImgUrl));
          userTweets = Array.prototype.slice.call(document.querySelectorAll("[data-component-term='tweet']"));
          userProfLink = document.querySelector("[class='u-textUserColor']");
          if (userProfLink !== null) {
            userProfLink.setAttribute("href", userProfLink.getAttribute("title"));
          }
        }

        userTweets.forEach(function (targetNode) {
          var tweetDivTag, tweetFrame;
          if (typeof targetNode.childNodes[3] === "undefined") {
            // div.ProfileTweet u-textBreak js-tweet js-stream-tweet js-actionable-tweet     ProfileTweet--high
            tweetFrame = targetNode.childNodes[1].childNodes[1].childNodes[1];
            tweetFrame.style.marginBottom = "-10px";
            // div.ProfileTweet-contents
            tweetDivTag = tweetFrame.childNodes[3];
            // p.ProfileTweet-text js-tweet-text u-dir
            tweetDivTag.childNodes[1].style.fontSize = "12px";
            tweetDivTag.childNodes[1].style.lineHeight = "18px";
            // div.ProfileTweet-contextualLink u-textUserColor  ->  link
            if (typeof tweetDivTag.childNodes[5] !== "undefined") {
              tweetDivTag.childNodes[5].style.height = "7px";
            }
            // div.ProfileTweet-actionList u-cf js-actions  ->  not link
            else {
              tweetDivTag.childNodes[3].style.height = "30px";
              tweetDivTag.childNodes[3].style.marginTop = "-7px";
            }
          }
        });

        if (document.querySelectorAll("[class='ScrollBump ScrollBump--recentlyFollowed']") !== null) {
          Array.prototype.slice.call(document.querySelectorAll("[class='ScrollBump ScrollBump--recentlyFollowed']")).forEach(
            function (targetNode) {
              targetNode.style.display = "none";
            }
          );
        }

        if (document.querySelectorAll("[class='TwitterPhoto-link media-thumbnail twitter-timeline-link']") !== null) {
          Array.prototype.slice.call(document.querySelectorAll("[class='TwitterPhoto-link media-thumbnail twitter-timeline-link']")).forEach(
              function (targetNode) {
                targetNode.setAttribute("target", "_blank");
                targetNode.setAttribute("class", "twitter-timeline-link");
              }
          );
        }

        link.forEach(function (targetNode) {
          // "pic.twitter.com"
          if (targetNode.hasAttribute("data-pre-embedded")) {
            targetNode.setAttribute("href", "http://" + targetNode.childNodes[0].nodeValue);
          }
          // not "pic.twitter.com"
          else if (targetNode.hasAttribute("title")) {
            targetNode.setAttribute("href", targetNode.getAttribute("title"));
          }
          targetNode.setAttribute("target", "_blank");
        });
      },
      // MutationObserver
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      observer;

  userPageStyleChange();
  // MutationObserver-------------------------------------------------------------------
  observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length !== 0) {
        userPageStyleChange(mutation.addedNodes);
      }
    });
  });
  observer.observe(document.querySelector("[class='GridTimeline-items']"), {childList: true } );
})();