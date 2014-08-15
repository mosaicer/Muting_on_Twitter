// ==UserScript==
// @name        Twitter Style Changer
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Changes tweets' style on user pages of Twitter
// @version     2.1
// @include     https://twitter.com/*
// @exclude     https://twitter.com/
// @exclude     https://twitter.com/search?*
// @grant       none
// ==/UserScript==
(function () {
  "use strict";

  var userPageStyleChange = function (addedTweets) {
        var userTweets = "",
            // all links
            link = Array.prototype.slice.call(document.querySelectorAll("[class='twitter-timeline-link']")),
            // the link of the bottom of user profile
            userProfLink;

        if (typeof addedTweets !== "undefined") {
          userTweets = Array.prototype.slice.call(addedTweets);
        }
        else {
          userTweets = Array.prototype.slice.call(document.querySelectorAll("[data-component-term='tweet']"));
          userProfLink = document.querySelector("[class='u-textUserColor']");
          userProfLink.setAttribute("href", userProfLink.getAttribute("title"));
        }

        userTweets.forEach(function (targetNode) {
          var tweetDivTag; // div.ProfileTweet-contents
          if (typeof targetNode.childNodes[3] === "undefined") {
            tweetDivTag = targetNode.childNodes[1].childNodes[1].childNodes[1].childNodes[3];
            tweetDivTag.childNodes[1].style.fontSize = "12px";
            tweetDivTag.childNodes[1].style.lineHeight = "18px";
            if (tweetDivTag.childNodes[3].nodeName === "DIV") {
              tweetDivTag.childNodes[5].style.height = "7px";
            }
            else {
              tweetDivTag.childNodes[3].style.height = "7px";
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