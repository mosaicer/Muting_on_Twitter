// ==UserScript==
// @name        Muting+α on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Muting texts/links/tags on "Twitter Web Client" and changing tweets' style
// @version     1.1
// @include     https://twitter.com/*
// @exclude     https://twitter.com/settings/*
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
// @require     https://raw.githubusercontent.com/kvz/phpjs/master/functions/pcre/preg_quote.js
// ==/UserScript==

// ページを読み込んだ後に実行
$(function() {
  // ホームの時
  if(window.location.href == "https://twitter.com/") {
    // インストール時の設定
    var flagAry = ["mute_text_flag", "mute_link_flag", "mute_tag_flag", "style_flag", "form_flag", "lang_flag"];
    for(var i = 0; i < flagAry.length; i++) {
      if(i == flagAry.length - 1) { // 言語を決めるときだけ
        if(typeof GM_getValue(flagAry[i]) == 'undefined') {
          var lang = confirm("OKで日本語に、キャンセルで英語に設定します\n" + 
            "(The button 'OK'/'Cancel' can set a language for Japanese/English)");
          GM_setValue(flagAry[i], lang);
          if(GM_getValue("lang_flag") == true)
            alert("日本語に設定しました。\nユーザースクリプトコマンドから英語に切り替えられます");
          else
            alert("Finish setting it.\nYou can change the language you use to Japanese by acsessing User Script Command");
        }
      } else {
        // インストール後、最初のアクセスの時、全ての機能を有効にする
        if(typeof GM_getValue(flagAry[i]) == 'undefined')
          GM_setValue(flagAry[i], 1);
      }
    }
    // セットされているミュートする文字列を取ってくる
    var muteNameAry = ["mute_words", "mute_links", "mute_tags"];
    for(var i = 0; i < muteNameAry.length; i++) {
      if(typeof GM_getValue(muteNameAry[i]) != 'undefined') {
        // 2つ以上単語がある場合
        if(GM_getValue(muteNameAry[i]).indexOf(",/") != -1) {
          var tempMuteAry = GM_getValue(muteNameAry[i]).split(",/");
          switch(i) {
            case 0: var muteWordAry = tempMuteAry; break;
            case 1: var muteLinkAry = tempMuteAry; break;
            case 2: var muteTagAry = tempMuteAry; break;
          }
        // 1つしか単語がない場合
        } else {
          var tempMuteVar = GM_getValue(muteNameAry[i]);
          switch(i) {
            case 0: var muteWordAry = tempMuteVar; break;
            case 1: var muteLinkAry = tempMuteVar; break;
            case 2: var muteTagAry = tempMuteVar; break;
          }
        }
      }
    }

    setCommandMenu(); // ユーザスクリプトコマンドサブメニューに項目を追加する
    headerRestruct(); // タイムライン上部を操作する
    if(GM_getValue("style_flag") == 1)
      tweetStyleChange(); // 各ツイートを装飾する
    muteTweet(); // ツイートをミュートする
  }
  // 各ユーザーページの時
  else
    userPageStyleChange();


  // 追加のページの読み込みを監視して実行-----------------------------------------------------------------------
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
  if (window.location.href == "https://twitter.com/")
    var target = document.querySelector("ol[id='stream-items-id']");
  else
    var target = document.querySelector("div[class='GridTimeline-items']");
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if(window.location.href == "https://twitter.com/") {
        if(GM_getValue("style_flag") == 1)
          tweetStyleChange();
        // 空じゃない時
        if(mutation.addedNodes.length != 0)
          muteTweet(mutation.addedNodes); // 追加されたノードを渡す
      } else if(mutation.addedNodes.length != 0)
        userPageStyleChange(mutation.addedNodes);
    });
  });
  observer.observe(target, {childList: true } );
  // ------------------------------------------------------------------------------------------------------------


  // ユーザスクリプトコマンドサブメニューに項目を追加する
  function setCommandMenu() {
    var msgLtr = [
      ["ツイート本文についてのミュートを", "リンクについてのミュートを", 
      "ハッシュタグについてのミュートを", "各ツイートの装飾を"],
      [" mute for texts in tweet", " mute for links in tweet", 
      " mute for hashtags in tweet", " changing tweet style"],
      ["無効", "有効"],
      ["Disable", "Enable"],
      ["英語に切り替える", "Change the language you're using to Japanese"]
    ];
    var msgAry = [];
    var langChk = GM_getValue("lang_flag") == true ? 0 : 1;

    for(var i = 0; i < 4; i++) {
      var msg_flag = GM_getValue(flagAry[i]) == 1 ? msgLtr[langChk+2][0] : msgLtr[langChk+2][1]; // 有効/無効の時、無効/有効にする
      var msg = langChk == 0 ? msgLtr[0][i] + msg_flag + "にする" : msg_flag + msgLtr[1][i];
      msgAry.push(msg);
    }
    msg = langChk == 0 ? msgLtr[4][0] : msgLtr[4][1];
    msgAry.push(msg);

    // 各ユーザースクリプトコマンドサブメニューにメッセージを付加する
    GM_registerMenuCommand(msgAry[0], muteTextChange);
    GM_registerMenuCommand(msgAry[1], muteLinkChange);
    GM_registerMenuCommand(msgAry[2], muteTagChange);
    GM_registerMenuCommand(msgAry[3], styleChange);
    GM_registerMenuCommand(msgAry[4], langChange);


    // ツイート本文についてのミュートの有効/無効を切り替える
    function muteTextChange() {
      var text_flag = GM_getValue("mute_text_flag") == 1 ? 0 : 1; // 有効/無効の時、無効/有効にする
      GM_setValue("mute_text_flag", text_flag);
      location.href = "https://twitter.com/"; // ページを更新して設定を反映させる
    }
    // リンクについてのミュートの有効/無効を切り替える
    function muteLinkChange() {
      var link_flag = GM_getValue("mute_link_flag") == 1 ? 0 : 1;
      GM_setValue("mute_link_flag", link_flag);
      location.href = "https://twitter.com/";
    }
    // ハッシュタグについてのミュートの有効/無効を切り替える
    function muteTagChange() {
      var tag_flag = GM_getValue("mute_tag_flag") == 1 ? 0 : 1;
      GM_setValue("mute_tag_flag", tag_flag);
      location.href = "https://twitter.com/";
    }
    // 各ツイートの装飾の有効/無効を切り替える
    function styleChange() {
      var style_flag_sc = GM_getValue("style_flag") == 1 ? 0 : 1;
      GM_setValue("style_flag", style_flag_sc);
      location.href = "https://twitter.com/";
    }
    // 言語を切り替える
    function langChange() {
      var lang_flag_sc = GM_getValue("lang_flag") == true ? false : true;
      GM_setValue("lang_flag", lang_flag_sc);
      location.href = "https://twitter.com/";
    }
  }

  // タイムライン上部を操作する
  function headerRestruct() {
    // スタイルを変更する
    $(".content-header").css("border-style", "hidden");
    $(".header-inner").css("height", "90px").css("background-color", "transparent");

    // ページのヘッダーのツイッターアイコンの横にフォーム欄の開閉を操作できるボタンを置く
    var op_cl_msg = GM_getValue("lang_flag") == true ? "▼フォーム欄の開閉 " : "▼Open/Close input form ";
    var open_close = $("<span>").attr("id", "show_hide").css("color", "red").text(op_cl_msg);
    $("h1[class='Icon Icon--bird bird-topbar-etched']").after(open_close);
    // ページの先頭へジャンプできるボタンを置く
    var pTop_msg = GM_getValue("lang_flag") == true ? "▲ページの先頭へ" : "▲Jump at the top of page";
    var page_top = $("<span>").attr("id", "move_top").css("color", "blue").text(pTop_msg);
    $("span#show_hide").after(page_top);

    // ボタンとフォーム内の文字を構成する
    var formNameAry = [
      ["追加", "削除", "確認"],
      ["Add", "Del", "Confirm"],
      ["ツイート本文についてミュートする文字を入力してください", "リンクについてミュートする文字を入力してください", 
      "ハッシュタグについてミュートする文字を入力してください"],
      ["Please input letters you want mute for texts in tweet", "Please input letters you want mute for links in tweet", 
      "Please input letters you want mute for hashtags in tweet"]
    ];
    var btnAry = [];
    var plchldrAry = [];
    for(var i = 0; i < 3; i++) {
      var btnName = GM_getValue("lang_flag") == 1 ? formNameAry[0][i] : formNameAry[1][i];
      var plchldrName = GM_getValue("lang_flag") == 1 ? formNameAry[2][i] : formNameAry[3][i];
      btnAry.push(btnName);
      plchldrAry.push(plchldrName);
    }

    // 各テキストボックスとボタンを設置
    $("#content-main-heading").html("<form name='mTextForm' onsubmit='return false;'>" + 
        "<input type='text' class='form_btn' name='muteWord' value='' placeholder='" + plchldrAry[0] + "' style='width:400px;'>" + 
        "<input type='button' id='mWordAdd' class='form_btn' value='" + btnAry[0] + "'>" + 
        "<input type='button' id='mWordRmv' class='form_btn' value='" + btnAry[1] + "'>" + 
        "<input type='button' id='mWordConf' value='" + btnAry[2] + "' style='float:left;'>" + 
        "</form><br><form name='mLinkForm' onsubmit='return false;'>" + 
        "<input type='text' class='form_btn' name='muteLink' value='' placeholder='" + plchldrAry[1] + "' style='width:400px;'>" + 
        "<input type='button' id='mLinkAdd' class='form_btn' value='" + btnAry[0] + "'>" + 
        "<input type='button' id='mLinkRmv' class='form_btn' value='" + btnAry[1] + "'>" + 
        "<input type='button' id='mLinkConf' value='" + btnAry[2] + "' style='float:left;'>" + 
        "</form><br><form name='mTagForm' onsubmit='return false;'>" + 
        "<input type='text' class='form_btn' name='muteTag' value='' placeholder='" + plchldrAry[2] + "' style='width:400px;'>" + 
        "<input type='button' id='mTagAdd' class='form_btn' value='" + btnAry[0] + "'>" + 
        "<input type='button' id='mTagRmv' class='form_btn' value='" + btnAry[1] + "'>" + 
        "<input type='button' id='mTagConf' value='" + btnAry[2] + "' style='float:left;'>" + 
        "</form>");
    $(".form_btn").css("float", "left").css("margin-right", "10px");

    if(GM_getValue("form_flag") == 0)
      $("div[class='content-header']").hide();

    // アラートで出すメッセージを構成する
    var altMsgAry = [
      ["ミュートしたい文字列はすでに設定されています", "ミュートしたい文字列は削除できません", 
      "ミュートしたい文字列は設定した文字列とマッチしませんでした", 
      "↓ミュートする文字列をカンマ区切りで表示しています↓\n\n", "ミュートする文字列が設定されていません", 
      "申し訳ないですが、ミュートする文字列に,/は使うことができません"],
      ["The word is already set for mute word", "The word can not be deleted", 
      "The word is not set for mute word", "↓The mute words separated by conmma↓\n\n", 
      "The mute words are not found", "Sorry, the mute words which contains the word ',/' can not be set"]
    ];
    var altMsg = [];
    for(var i = 0; i < 6; i++) {
      var altMsgName = GM_getValue("lang_flag") == 1 ? altMsgAry[0][i] : altMsgAry[1][i];
      altMsg.push(altMsgName);
    }

    // 各ボタンを押した時---------------------------------------------------------------------------------
    // フォーム欄を…
    $("#show_hide").click(function() {
      if(GM_getValue("form_flag") == 1) {
        $("div[class='content-header']").hide('slow'); // 閉じる
        GM_setValue("form_flag", 0);
      } else {
        $("div[class='content-header']").show('slow'); // 開く
        GM_setValue("form_flag", 1);
      }
    });

    // ページの先頭へジャンプする
    $("#move_top").click(function() {
      window.scroll(0, 0);
    });

    // ツイートのテキストについてミュートする文字を…
    $("#mWordAdd").click(function() { //   追加
      addMuteLtr($("form[name='mTextForm'] > input[name='muteWord']").val(), 0, altMsg);
    });
    $("#mWordRmv").click(function() { //   削除
      delMuteLtr($("form[name='mTextForm'] > input[name='muteWord']").val(), 0, altMsg);
    });
    $("#mWordConf").click(function() { //  確認
      confMuteLtr(0, altMsg);
    });

    // ツイートのリンクについてミュートする文字を…
    $("#mLinkAdd").click(function() { //   追加
      addMuteLtr($("form[name='mLinkForm'] > input[name='muteLink']").val(), 1, altMsg);
    });
    $("#mLinkRmv").click(function() { //   削除
      delMuteLtr($("form[name='mLinkForm'] > input[name='muteLink']").val(), 1, altMsg);
    });
    $("#mLinkConf").click(function() { //  確認
      confMuteLtr(1, altMsg);
    });

    // ツイートのタグについてミュートする文字を…
    $("#mTagAdd").click(function() { //    追加
      addMuteLtr($("form[name='mTagForm'] > input[name='muteTag']").val(), 2, altMsg);
    });
    $("#mTagRmv").click(function() { //    削除
      delMuteLtr($("form[name='mTagForm'] > input[name='muteTag']").val(), 2, altMsg);
    });
    $("#mTagConf").click(function() { //   確認
      confMuteLtr(2, altMsg);
    });
    // ---------------------------------------------------------------------------------------------------
  }

  // ミュートする文字列を追加する
  function addMuteLtr(add_ltr, btn_flag, btnMsg) {
    var splLtr = /,\//;
    // 区切り文字が含まれている場合
    if(add_ltr.match(splLtr)) {
      alert(btnMsg[5]);
    // 未入力の場合ではない時
    } else if(add_ltr != "") {
      switch(btn_flag){
        case 0: if(typeof GM_getValue(muteNameAry[0]) != 'undefined') var muteLtrAry = muteWordAry; break;
        case 1: if(typeof GM_getValue(muteNameAry[1]) != 'undefined') var muteLtrAry = muteLinkAry; break;
        case 2: if(typeof GM_getValue(muteNameAry[2]) != 'undefined') var muteLtrAry = muteTagAry; break;
      }
      // 初めてor空に、追加する時
      if(typeof GM_getValue(muteNameAry[btn_flag]) == 'undefined' || muteLtrAry == "") {
        GM_setValue(muteNameAry[btn_flag], add_ltr);
        location.href = "https://twitter.com/";
      // すでに入ってる状態の時
      } else {
        var cnt = 0;
        // 2つ以上単語がある場合
        if(muteLtrAry.indexOf(",/") != -1) {
          for (var i = 0; i < muteLtrAry.length && cnt == 0; i++) {
            if(i != 0)
              muteLtrTemp = muteLtrTemp + ",/" + muteLtrAry[i]; // ,/で区切って単語を繋げていく
            else
              var muteLtrTemp = muteLtrAry[i];
            // 重複チェック
            if(muteLtrAry[i] == add_ltr)
              cnt++;
          }
        // 1つしか単語がない場合
        } else {
          var muteLtrTemp = muteLtrAry;
          if(muteLtrAry == add_ltr)
            cnt++;
        }
        // 重複していない時
        if(cnt == 0) {
          muteLtrTemp = muteLtrTemp + ",/" + add_ltr; // 入力された文字を最後に追加
          GM_setValue(muteNameAry[btn_flag], muteLtrTemp); // ミュートする文字列を再設定
          location.href = "https://twitter.com/";
        }
        // 重複している時
        else
          alert(btnMsg[0]);
      }
    }
  }
  // ミュートする文字列を削除する
  function delMuteLtr(del_ltr, btn_flag, btnMsg) {
    // 未入力ではない時
    if(del_ltr != "") {
      switch(btn_flag){
        case 0: if(typeof GM_getValue(muteNameAry[0]) != 'undefined') var muteLtrAry = muteWordAry; break;
        case 1: if(typeof GM_getValue(muteNameAry[1]) != 'undefined') var muteLtrAry = muteLinkAry; break;
        case 2: if(typeof GM_getValue(muteNameAry[2]) != 'undefined') var muteLtrAry = muteTagAry; break;
      }
      // 文字列が入ってない時
      if(typeof GM_getValue(muteNameAry[btn_flag]) == 'undefined' || muteLtrAry == "") {
        alert(btnMsg[1]);
      // 文字列がセットされている時
      } else {
        var cnt = 0; // 削除された回数をカウント
        var muteLtrTemp = "";
        // 2つ以上単語がある場合
        if(muteLtrAry.indexOf(",/") != -1) {
          for(var i = 0; i < muteLtrAry.length; i++) {
            if(muteLtrAry[i] != del_ltr) {
              if(muteLtrTemp != "")
                muteLtrTemp = muteLtrTemp + ",/" + muteLtrAry[i];
              else
                muteLtrTemp = muteLtrAry[i];
            }
            else
              cnt++;
          }
        // 1つしか単語がない場合
        } else {
          if(muteLtrAry != del_ltr)
            muteLtrTemp = muteLtrAry;
          else
            cnt++;
        }
        // 入力された文字が削除された時
        if(cnt != 0) {
          GM_setValue(muteNameAry[btn_flag], muteLtrTemp); // ミュートする文字列を再設定
          location.href = "https://twitter.com/";
        }
        // 入力された文字が削除されなかった時
        else
          alert(btnMsg[2]);
      }
    }
  }
  // ミュートする文字列を確認する
  function confMuteLtr(btn_flag, btnMsg) {
    switch(btn_flag){
      case 0: if(typeof GM_getValue(muteNameAry[0]) != 'undefined') var muteLtrAry = muteWordAry; break;
      case 1: if(typeof GM_getValue(muteNameAry[1]) != 'undefined') var muteLtrAry = muteLinkAry; break;
      case 2: if(typeof GM_getValue(muteNameAry[2]) != 'undefined') var muteLtrAry = muteTagAry; break;
    }
    // ミュートする文字列が設定されていた時
    if(typeof GM_getValue(muteNameAry[btn_flag]) != 'undefined'  && typeof muteLtrAry != 'undefined' && muteLtrAry != "")
      alert(btnMsg[3] + muteLtrAry);
    // ミュートする文字列が設定されていなかった時
    else
      alert(btnMsg[4]);
  }

  // 各ツイートを装飾する
  function tweetStyleChange() {
    $("p[class='js-tweet-text tweet-text']").css("font-weight", "bold"); // ツイートの文字を太字に
    $("[class*='js-action-profile-name']").css("color", "red"); // ユーザー名を赤く
    $("span[data-long-form='true']").css("color", "blue"); // ユーザーIDを赤く
    $("a[class='twitter-timeline-link']").attr("target", "_blank"); // リンクは必ず新しいタブに飛ばす
  }

  // ミュート機能を始動する関数
  function muteTweet(addedTweets) {
    $("div[data-promoted='true']").parent().remove(); // プロモーションを消去
    $("div[class='promptbird promptbird-below-black-bar']").remove(); // 人と繋がるバナーを消去

    var homeTweets = [];
    // ノードが追加された時
    if(typeof addedTweets != 'undefined')
      homeTweets = addedTweets;
    // ノードが追加されなかった時
    else
      homeTweets = document.querySelectorAll("li[data-item-type='tweet']"); // 各ツイートの大元

    for (var i = 0; i < homeTweets.length; i++) {
      tweetPrnt = homeTweets[i]; // ミュートする時に参照する
      // <LI>タグ内が空ではない時
      if(typeof tweetPrnt.childNodes[1].childNodes[3] != 'undefined')
        tweetPtag = tweetPrnt.childNodes[1].childNodes[3].childNodes[3]; // 要素を判断する時に参照する
      // 返信のツイートである時
      if(typeof tweetPtag == 'undefined') {
        // 要素がある場合
        for(var j = 3; typeof tweetPrnt.childNodes[1].childNodes[j] != 'undefined'; j++) {
          var replyPrnt = tweetPrnt.childNodes[1].childNodes[j];
          if(typeof replyPrnt.childNodes[1] != 'undefined' && replyPrnt.childNodes[1].getAttribute("data-you-block")) {
            tweetPrnt = replyPrnt;
            tweetPtag = replyPrnt.childNodes[1].childNodes[3].childNodes[3];
            tweetElmChk(tweetPtag);
            tweetPrnt = homeTweets[i]; // 値を元に戻す
          }
        }
      }
      // 返信ではない場合
      else
        tweetElmChk(tweetPtag);
    }
  }

  // ツイート内の要素を判断する
  function tweetElmChk(twtPtag) {
    // <P>タグのi番目の要素がある場合
    for(var i = 0; typeof twtPtag.childNodes[i] != 'undefined'; i++) {
      tweetElmnt = twtPtag.childNodes[i]; // ミュートする時に参照する
      // <A>タグの時
      if(tweetElmnt.nodeName == 'A') {
        // pic.twitter.com
        if(tweetElmnt.getAttribute("data-pre-embedded")) {
          tweetElmnt.href = "http://" + tweetElmnt.childNodes[0].nodeValue; // 元のURLでジャンプさせる
          muteLtrFunc(1);
        // pic.twitter.com以外のリンク
        } else if(tweetElmnt.getAttribute("title")) {
          tweetElmnt.href = tweetElmnt.getAttribute("title");
          muteLtrFunc(1);
        // ハッシュタグ
        } else if(tweetElmnt.getAttribute("data-query-source")) {
          muteLtrFunc(2);
        }
      // テキストの時
      } else if(tweetElmnt.nodeName == '#text') {
        muteLtrFunc(0);
      }
    }
  }

  // ミュートする文字を決定する
  function muteLtrFunc(mute_flag) {
    switch(mute_flag){
      case 0: if(typeof GM_getValue(muteNameAry[0]) != 'undefined') var muteLtrFuncAry = muteWordAry; break;
      case 1: if(typeof GM_getValue(muteNameAry[1]) != 'undefined') var muteLtrFuncAry = muteLinkAry; break;
      case 2: if(typeof GM_getValue(muteNameAry[2]) != 'undefined') var muteLtrFuncAry = muteTagAry; break;
    }
    if(typeof GM_getValue(muteNameAry[mute_flag]) != 'undefined' && GM_getValue(flagAry[mute_flag]) == 1 && muteLtrFuncAry != "") {
      // 2つ以上単語がある場合
      if(muteLtrFuncAry.indexOf(",/") != -1) {
        for(var i = 0; i < muteLtrFuncAry.length; i++) {
          var muteLtr = new RegExp( preg_quote(muteLtrFuncAry[i]) );
          switch(mute_flag){
            case 0: muteTextFunc(muteLtr); break;
            case 1: muteLinkFunc(muteLtr); break;
            case 2: muteTagFunc(muteLtr); break;
          }
        }
      // 1つしか単語がない場合
      } else {
        var muteLtr = new RegExp( preg_quote(muteLtrFuncAry) );
        switch(mute_flag){
          case 0: muteTextFunc(muteLtr); break;
          case 1: muteLinkFunc(muteLtr); break;
          case 2: muteTagFunc(muteLtr); break;
        }
      }
    }
  }

  // ツイートのテキストについてミュートする
  function muteTextFunc(targetMuteLtr) {
    if(tweetElmnt.nodeValue.match(targetMuteLtr))
      $(tweetPrnt).remove(); // ツイートの大元を消去
  }
  // ツイートのリンクについてミュートする
  function muteLinkFunc(targetMuteLtr) {
    // pic.twitter.com以外のリンク
    if(tweetElmnt.getAttribute("title")) {
      if(tweetElmnt.getAttribute("title").match(targetMuteLtr))
        $(tweetPrnt).remove();
    // pic.twitter.com
    } else if(tweetElmnt.childNodes[0].nodeValue.match(targetMuteLtr)) {
      $(tweetPrnt).remove();
    }
  }
  // ツイートのタグについてミュートする
  function muteTagFunc(targetMuteLtr) {
    if(tweetElmnt.childNodes[1].childNodes[0].nodeValue.match(targetMuteLtr))
      $(tweetPrnt).remove();
  }


  // ユーザーページのスタイルを変更する---------------------------------------------------------------------
  function userPageStyleChange(addedTweets) {
    var userTweets = [];
    if(typeof addedTweets != 'undefined')
      userTweets = addedTweets;
    else
      userTweets = document.querySelectorAll("div[data-component-term='tweet']"); // 各ツイートの大元

    // ツイート欄を調整する
    for(var i = 0; i < userTweets.length && typeof userTweets[i].childNodes[3] == 'undefined'; i++) {
      var tweetDivtag = userTweets[i].childNodes[1].childNodes[1].childNodes[1].childNodes[3]; // div.ProfileTweet-contents
      tweetDivtag.childNodes[1].style.fontSize = '12px';
      tweetDivtag.childNodes[1].style.lineHeight = '18px';
      // 詳細or概要がある場合
      if(tweetDivtag.childNodes[3].nodeName == 'DIV') {
        tweetDivtag.childNodes[5].style.height = '7px';
      // 詳細or概要がない場合
      } else {
        tweetDivtag.childNodes[3].style.height = '7px';
        tweetDivtag.childNodes[3].style.marginTop = '-7px';
      }
    }

    $("div[class='ScrollBump ScrollBump--recentlyFollowed']").remove(); // フォローの繋がりの部分を消去
    $("a[class='twitter-timeline-link']").attr("target", "_blank"); // リンクは必ず新しいタブに飛ばす
    // 元のURLでジャンプさせる
    var link = document.querySelectorAll("a[class='twitter-timeline-link']");
    for (var i = 0; i < link.length; i++) {
      // pic.twitter.com
      if(link[i].getAttribute("data-pre-embedded")) {
        link[i].href = "http://" + link[i].childNodes[0].nodeValue;
      // pic.twitter.com以外のリンク
      } else if(link[i].getAttribute("title")) {
        link[i].href = link[i].getAttribute("title");
      }
    }
  }
  // -----------------------------------------------------------------------------------------------------------
});