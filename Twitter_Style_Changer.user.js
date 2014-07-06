// ==UserScript==
// @name        Twitter Style Changer
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Changing tweets' style on user pages of Twitter
// @version     1.0
// @include     https://twitter.com/*
// @exclude     https://twitter.com/
// @grant       none
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
// ==/UserScript==

$(function () {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      observer;

  userPageStyleChange(); // ユーザーページのスタイルを変更する

  // 追加のページの読み込みを監視して実行------------------------------------------------------------------
  observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      // 空じゃない時
      if (mutation.addedNodes.length !== 0) {
        userPageStyleChange(mutation.addedNodes); // 追加されたノードを渡す
      }
    });
  });
  observer.observe(document.querySelector("div[class='GridTimeline-items']"), {childList: true } );
  // -------------------------------------------------------------------------------------------------------

  // ユーザーページのスタイルを変更する
  function userPageStyleChange(addedTweets) {
    var i,
        // 対象の各ツイートの大元
        userTweets = [],
        // div.ProfileTweet-contents
        tweetDivTag,
        // 全てのリンクを取得
        link = document.querySelectorAll("a[class='twitter-timeline-link']"),
        // ユーザープロフィール下部のリンク
        userProfLink;

    // ノードが追加された時
    if (typeof addedTweets !== "undefined") {
      userTweets = addedTweets;
    }
    // ノードが追加されなかった時
    else {
      userTweets = document.querySelectorAll("div[data-component-term='tweet']");
      // 元のURLでジャンプさせる
      userProfLink = $("a[class='u-textUserColor']");
      $(userProfLink).attr("href", $(userProfLink).attr("title"));
    }

    // ツイート欄を調整する
    for (i = 0; i < userTweets.length && typeof userTweets[i].childNodes[3] === "undefined"; i++) {
      tweetDivTag = userTweets[i].childNodes[1].childNodes[1].childNodes[1].childNodes[3];
      $(tweetDivTag.childNodes[1]).css("font-size", "12px").css("line-height", "18px");
      // 詳細or概要がある場合
      if (tweetDivTag.childNodes[3].nodeName === "DIV") {
        $(tweetDivTag.childNodes[5]).css("height", "7px");
      }
      // 詳細or概要がない場合
      else {
        $(tweetDivTag.childNodes[3]).css("height", "7px").css("margin-top", "-7px");
      }
    }

    $("div[class='ScrollBump ScrollBump--recentlyFollowed']").remove(); // フォローの繋がりの部分を消去
    $("a[class='twitter-timeline-link']").attr("target", "_blank"); // リンクは必ず新しいタブに飛ばす

    // 元のURLでジャンプさせる
    for (i = 0; i < link.length; i++) {
      // pic.twitter.com
      if ( link[i].getAttribute("data-pre-embedded") ) {
        link[i].href = "http://" + link[i].childNodes[0].nodeValue;
      }
      // pic.twitter.com以外のリンク
      else if ( link[i].getAttribute("title") ) {
        link[i].href = link[i].getAttribute("title");
      }
    }
  }
});