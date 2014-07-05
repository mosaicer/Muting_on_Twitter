// ==UserScript==
// @name        Muting+α on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Muting texts/links/tags on "Twitter Web Client" and changing tweets' style
// @version     2.0
// @include     https://twitter.com/
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
// @require     https://raw.githubusercontent.com/kvz/phpjs/master/functions/pcre/preg_quote.js
// ==/UserScript==

$(function () {
  var i,
      // 各フラグ名を格納
      flagAry = ["mute_text_flag", "mute_link_flag", "mute_tag_flag", "style_flag", "form_flag", "lang_flag"],
      // 最初の言語を決める時に使用
      lang,
      // ミュートする文字名を格納
      muteNameAry = ["mute_words", "mute_links", "mute_tags"],
      // 一時的に取得した値を代入
      tempMuteAry,
      tempMuteVar,
      // 文字列によって分けて格納
      muteWordAry,
      muteLinkAry,
      muteTagAry,
      // MutationObserver
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      observer,
      // ミュートする時に参照する要素
      tweetElmnt,
      tweetPrnt;

  // インストール時の設定
  for (i = 0; i < flagAry.length; i++) {
    if (i === flagAry.length - 1) { // 言語を決めるときだけ
      if (typeof GM_getValue(flagAry[i]) === "undefined") {
        lang = confirm("OKで日本語に、キャンセルで英語に設定します\n" +
          "(The button 'OK'/'Cancel' can set a language for Japanese/English)");
        GM_setValue(flagAry[i], lang);
        if (GM_getValue("lang_flag") === true) {
          alert("日本語に設定しました。\nユーザースクリプトコマンドから英語に切り替えられます");
        } else {
          alert("Finish setting it.\nYou can change the language you use to Japanese by acsessing User Script Command");
        }
      }
    }
    // インストール後、最初のアクセスの時、全ての機能を有効にする
    else if (typeof GM_getValue(flagAry[i]) === "undefined") {
      GM_setValue(flagAry[i], 1);
    }
  }

  // セットされているミュートする文字列を取ってくる
  for (i = 0; i < muteNameAry.length; i++) {
    if (typeof GM_getValue(muteNameAry[i]) !== "undefined") {
      // 2つ以上単語がある場合
      if (GM_getValue(muteNameAry[i]).indexOf(",/") !== -1) {
        tempMuteAry = GM_getValue(muteNameAry[i]).split(",/");
        switch (i) {
          case 0: muteWordAry = tempMuteAry; break;
          case 1: muteLinkAry = tempMuteAry; break;
          case 2: muteTagAry = tempMuteAry; break;
        }
      }
      // 1つしか単語がない場合
      else {
        tempMuteVar = GM_getValue(muteNameAry[i]);
        switch (i) {
          case 0: muteWordAry = tempMuteVar; break;
          case 1: muteLinkAry = tempMuteVar; break;
          case 2: muteTagAry = tempMuteVar; break;
        }
      }
    }
  }

  setCommandMenu(); // ユーザスクリプトコマンドサブメニューに項目を追加する
  headerRestruct(); // タイムライン上部を操作する
  if (GM_getValue("style_flag") === 1) {
    tweetStyleChange(); // 各ツイートを装飾する
  }
  muteTweet(); // ツイートをミュートする


  // 追加のページの読み込みを監視して実行-----------------------------------------------------------------------
  observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (GM_getValue("style_flag") === 1) {
        tweetStyleChange();
      }
      // 空じゃない時
      if (mutation.addedNodes.length !== 0) {
        muteTweet(mutation.addedNodes); // 追加されたノードを渡す
      }
    });
  });
  observer.observe(document.querySelector("ol[id='stream-items-id']"), {childList: true } );
  // ------------------------------------------------------------------------------------------------------------


  // ユーザスクリプトコマンドサブメニューに項目を追加する
  function setCommandMenu() {
        // 日本語・英語のメッセージを格納
    var msgLtr = [
          ["ツイート本文についてのミュートを", "リンクについてのミュートを",
          "ハッシュタグについてのミュートを", "各ツイートの装飾を"],
          [" mute for texts in tweet", " mute for links in tweet",
          " mute for hashtags in tweet", " changing tweet style"],
          ["無効", "有効"],
          ["Disable", "Enable"],
          ["英語に切り替える", "Change the language you're using to Japanese"]
        ],
        // メニューに使うメッセージすべてを格納
        msgAry = [],
        // 使ってる言語を判別
        langChk = GM_getValue("lang_flag") === true ? 0 : 1,
        // 有効or無効かの判別
        msg_flag,
        // msgAryに入れる個別のメッセージを代入
        msg;

    for (i = 0; i < 5; i++) {
      if (i !== 4) {
        msg_flag = GM_getValue(flagAry[i]) === 1 ? msgLtr[langChk+2][0] : msgLtr[langChk+2][1]; // 有効/無効の時、無効/有効にする
        msg = langChk === 0 ? msgLtr[0][i] + msg_flag + "にする" : msg_flag + msgLtr[1][i];
      } else {
        msg = langChk === 0 ? msgLtr[i][0] : msgLtr[i][1];
      }
      msgAry.push(msg);
    }

    // 各ユーザースクリプトコマンドサブメニューにメッセージを付加する
    GM_registerMenuCommand(msgAry[0], muteTextChange);
    GM_registerMenuCommand(msgAry[1], muteLinkChange);
    GM_registerMenuCommand(msgAry[2], muteTagChange);
    GM_registerMenuCommand(msgAry[3], styleChange);
    GM_registerMenuCommand(msgAry[4], langChange);


    // ツイート本文についてのミュートの有効/無効を切り替える
    function muteTextChange() {
      var text_flag = GM_getValue("mute_text_flag") === 1 ? 0 : 1; // 有効/無効の時、無効/有効にする
      GM_setValue("mute_text_flag", text_flag);
      location.href = "https://twitter.com/"; // ページを更新して設定を反映させる
    }
    // リンクについてのミュートの有効/無効を切り替える
    function muteLinkChange() {
      var link_flag = GM_getValue("mute_link_flag") === 1 ? 0 : 1;
      GM_setValue("mute_link_flag", link_flag);
      location.href = "https://twitter.com/";
    }
    // ハッシュタグについてのミュートの有効/無効を切り替える
    function muteTagChange() {
      var tag_flag = GM_getValue("mute_tag_flag") === 1 ? 0 : 1;
      GM_setValue("mute_tag_flag", tag_flag);
      location.href = "https://twitter.com/";
    }
    // 各ツイートの装飾の有効/無効を切り替える
    function styleChange() {
      var style_flag_sc = GM_getValue("style_flag") === 1 ? 0 : 1;
      GM_setValue("style_flag", style_flag_sc);
      location.href = "https://twitter.com/";
    }
    // 言語を切り替える
    function langChange() {
      var lang_flag_sc = GM_getValue("lang_flag") === true ? false : true;
      GM_setValue("lang_flag", lang_flag_sc);
      location.href = "https://twitter.com/";
    }
  }

  // タイムライン上部を操作する
  function headerRestruct() {
        // フォーム欄開閉のメッセージを代入
    var op_cl_msg = GM_getValue("lang_flag") === true ? "▼フォーム欄の開閉 " : "▼Open/Close input form ",
        open_close,
        // ページの先頭へ移動するボタンのメッセージを代入
        pTop_msg = GM_getValue("lang_flag") === true ? "▲ページの先頭へ" : "▲Jump at the top of page",
        page_top,
        // フォーム欄の各メッセージを格納
        formNameAry = [
          ["追加", "削除", "確認"],
          ["Add", "Del", "Confirm"],
          ["ツイート本文についてミュートする文字を入力してください", "リンクについてミュートする文字を入力してください",
          "ハッシュタグについてミュートする文字を入力してください"],
          ["Please input letters you want mute for texts in tweet", "Please input letters you want mute for links in tweet",
          "Please input letters you want mute for hashtags in tweet"]
        ],
        // ボタンのメッセージを格納
        btnAry = [],
        btnName,
        // placeholderのメッセージを格納
        plchldrAry = [],
        plchldrName,
        // アラートのメッセージを格納
        altMsgAry = [
          ["ミュートしたい文字列はすでに設定されています", "ミュートしたい文字列は削除できません",
          "ミュートしたい文字列は設定した文字列とマッチしませんでした",
          "↓ミュートする文字列をカンマ区切りで表示しています↓\n\n", "ミュートする文字列が設定されていません",
          "申し訳ないですが、ミュートする文字列に,/は使うことができません"],
          ["The word is already set for mute word", "The word can not be deleted",
          "The word is not set for mute word", "↓The mute words separated by conmma↓\n\n",
          "The mute words are not found", "Sorry, the mute words which contains the word ',/' can not be set"]
        ],
        altMsg = [],
        altMsgName;

    // スタイルを変更する
    $(".content-header").css("border-style", "hidden");
    $(".header-inner").css("height", "90px").css("background-color", "transparent");

    // ページのヘッダーのツイッターアイコンの横にフォーム欄の開閉を操作できるボタンを置く
    open_close = $("<span>").attr("id", "show_hide").css("color", "red").text(op_cl_msg);
    $("h1[class='Icon Icon--bird bird-topbar-etched']").after(open_close);

    // ページの先頭へジャンプできるボタンを置く
    page_top = $("<span>").attr("id", "move_top").css("color", "blue").text(pTop_msg);
    $("#show_hide").after(page_top);

    // ボタンとフォーム内の文字を構成する
    for (i = 0; i < 3; i++) {
      btnName = GM_getValue("lang_flag") === true ? formNameAry[0][i] : formNameAry[1][i];
      plchldrName = GM_getValue("lang_flag") === true ? formNameAry[2][i] : formNameAry[3][i];
      btnAry.push(btnName);
      plchldrAry.push(plchldrName);
    }

    // 各テキストボックスとボタンを設置
    $("#content-main-heading").html("<form name='mTextForm' onsubmit='return false;'>" +
        "<input type='text' class='form_btn' name='muteWord' value='' placeholder='" + plchldrAry[0] + "' style='width: 400px;'>" +
        "<input type='button' id='mWordAdd' class='form_btn' value='" + btnAry[0] + "'>" +
        "<input type='button' id='mWordRmv' class='form_btn' value='" + btnAry[1] + "'>" +
        "<input type='button' id='mWordConf' value='" + btnAry[2] + "' style='float: left;'>" +
        "</form><br><form name='mLinkForm' onsubmit='return false;'>" +
        "<input type='text' class='form_btn' name='muteLink' value='' placeholder='" + plchldrAry[1] + "' style='width: 400px;'>" +
        "<input type='button' id='mLinkAdd' class='form_btn' value='" + btnAry[0] + "'>" +
        "<input type='button' id='mLinkRmv' class='form_btn' value='" + btnAry[1] + "'>" +
        "<input type='button' id='mLinkConf' value='" + btnAry[2] + "' style='float: left;'>" +
        "</form><br><form name='mTagForm' onsubmit='return false;'>" +
        "<input type='text' class='form_btn' name='muteTag' value='' placeholder='" + plchldrAry[2] + "' style='width: 400px;'>" +
        "<input type='button' id='mTagAdd' class='form_btn' value='" + btnAry[0] + "'>" +
        "<input type='button' id='mTagRmv' class='form_btn' value='" + btnAry[1] + "'>" +
        "<input type='button' id='mTagConf' value='" + btnAry[2] + "' style='float: left;'>" +
        "</form>");
    $(".form_btn").css("float", "left").css("margin-right", "10px");

    if (GM_getValue("form_flag") === 0) {
      $("div[class='content-header']").hide();
    }

    // アラートで出すメッセージを構成する
    for (i = 0; i < 6; i++) {
      altMsgName = GM_getValue("lang_flag") === true ? altMsgAry[0][i] : altMsgAry[1][i];
      altMsg.push(altMsgName);
    }

    // 各ボタンを押した時---------------------------------------------------------------------------------
    // フォーム欄を…
    $("#show_hide").click(function () {
      if (GM_getValue("form_flag") === 1) {
        $("div[class='content-header']").hide("slow"); // 閉じる
        GM_setValue("form_flag", 0);
      } else {
        $("div[class='content-header']").show("slow"); // 開く
        GM_setValue("form_flag", 1);
      }
    });

    // ページの先頭へジャンプする
    $("#move_top").click(function () {
      window.scroll(0, 0);
    });

    // ツイートのテキストについてミュートする文字を…
    $("#mWordAdd").click(function () { //   追加
      addMuteLtr($("form[name='mTextForm'] > input[name='muteWord']").val(), 0, altMsg);
    });
    $("#mWordRmv").click(function () { //   削除
      delMuteLtr($("form[name='mTextForm'] > input[name='muteWord']").val(), 0, altMsg);
    });
    $("#mWordConf").click(function () { //  確認
      confMuteLtr(0, altMsg);
    });

    // ツイートのリンクについてミュートする文字を…
    $("#mLinkAdd").click(function () { //   追加
      addMuteLtr($("form[name='mLinkForm'] > input[name='muteLink']").val(), 1, altMsg);
    });
    $("#mLinkRmv").click(function () { //   削除
      delMuteLtr($("form[name='mLinkForm'] > input[name='muteLink']").val(), 1, altMsg);
    });
    $("#mLinkConf").click(function () { //  確認
      confMuteLtr(1, altMsg);
    });

    // ツイートのタグについてミュートする文字を…
    $("#mTagAdd").click(function () { //    追加
      addMuteLtr($("form[name='mTagForm'] > input[name='muteTag']").val(), 2, altMsg);
    });
    $("#mTagRmv").click(function () { //    削除
      delMuteLtr($("form[name='mTagForm'] > input[name='muteTag']").val(), 2, altMsg);
    });
    $("#mTagConf").click(function () { //   確認
      confMuteLtr(2, altMsg);
    });
    // ---------------------------------------------------------------------------------------------------
  }

  // ミュートする文字列を追加する
  function addMuteLtr(add_ltr, btn_flag, btnMsg) {
        // 区切り文字を代入
    var splLtr = /,\//,
        // 重複してるかどうかの判別
        cnt = 0,
        // 各ミュートする文字列を入れる
        muteLtrAry,
        // 区切った文字を入れなおす
        muteLtrTemp;

    // 区切り文字が含まれている場合
    if ( add_ltr.match(splLtr) ) {
      alert(btnMsg[5]);
    }
    // 未入力の場合ではない時
    else if (add_ltr !== "") {
      // ミュートする文字列が設定されていればそれを取得
      if (typeof GM_getValue(muteNameAry[btn_flag]) !== "undefined") {
        switch (btn_flag) {
          case 0: muteLtrAry = muteWordAry; break;
          case 1: muteLtrAry = muteLinkAry; break;
          case 2: muteLtrAry = muteTagAry; break;
        }
      }
      // 初めてor空に、追加する時
      if (typeof GM_getValue(muteNameAry[btn_flag]) === "undefined" || muteLtrAry === "") {
        GM_setValue(muteNameAry[btn_flag], add_ltr);
        location.href = "https://twitter.com/";
      }
      // すでに入ってる状態の時
      else {
        // 2つ以上単語がある場合
        if (GM_getValue(muteNameAry[btn_flag]).indexOf(",/") !== -1) {
          for (i = 0; i < muteLtrAry.length && cnt === 0; i++) {
            if (i !== 0) {
              muteLtrTemp = muteLtrTemp + ",/" + muteLtrAry[i]; // ,/で区切って単語を繋げていく
            } else {
              muteLtrTemp = muteLtrAry[i];
            }
            // 重複チェック
            if (muteLtrAry[i] === add_ltr) {
              cnt++;
            }
          }
        }
        // 1つしか単語がない場合
        else {
          muteLtrTemp = muteLtrAry;
          if (muteLtrAry === add_ltr) {
            cnt++;
          }
        }
        // 重複していない時
        if (cnt === 0) {
          muteLtrTemp = muteLtrTemp + ",/" + add_ltr; // 入力された文字を最後に追加
          GM_setValue(muteNameAry[btn_flag], muteLtrTemp); // ミュートする文字列を再設定
          location.href = "https://twitter.com/";
        }
        // 重複している時
        else {
          alert(btnMsg[0]);
        }
      }
    }
  }
  // ミュートする文字列を削除する
  function delMuteLtr(del_ltr, btn_flag, btnMsg) {
        // 各ミュートする文字列を入れる
    var muteLtrAry,
        // 削除されてるかどうかの判別
        cnt = 0,
        // 区切った文字を入れなおす
        muteLtrTemp = "";

    // 未入力ではない時
    if (del_ltr !== "") {
      // ミュートする文字列が設定されていればそれを取得
      if (typeof GM_getValue(muteNameAry[btn_flag]) !== "undefined") {
        switch (btn_flag) {
          case 0: muteLtrAry = muteWordAry; break;
          case 1: muteLtrAry = muteLinkAry; break;
          case 2: muteLtrAry = muteTagAry; break;
        }
      }
      // 文字列が入ってない時
      if (typeof GM_getValue(muteNameAry[btn_flag]) === "undefined" || muteLtrAry === "") {
        alert(btnMsg[1]);
      }
      // 文字列がセットされている時
      else {
        // 2つ以上単語がある場合
        if (GM_getValue(muteNameAry[btn_flag]).indexOf(",/") !== -1) {
          for (i = 0; i < muteLtrAry.length; i++) {
            if (muteLtrAry[i] !== del_ltr) {
              if (muteLtrTemp !== "") {
                muteLtrTemp = muteLtrTemp + ",/" + muteLtrAry[i];
              } else {
                muteLtrTemp = muteLtrAry[i];
              }
            } else {
              cnt++;
            }
          }
        }
        // 1つしか単語がない場合
        else {
          if (muteLtrAry !== del_ltr) {
            muteLtrTemp = muteLtrAry;
          } else {
            cnt++;
          }
        }
        // 入力された文字が削除された時
        if (cnt !== 0) {
          GM_setValue(muteNameAry[btn_flag], muteLtrTemp); // ミュートする文字列を再設定
          location.href = "https://twitter.com/";
        }
        // 入力された文字が削除されなかった時
        else {
          alert(btnMsg[2]);
        }
      }
    }
  }
  // ミュートする文字列を確認する
  function confMuteLtr(btn_flag, btnMsg) {
    var muteLtrAry; // 各ミュートする文字列を入れる

    // ミュートする文字列が設定されていればそれを取得
    if (typeof GM_getValue(muteNameAry[btn_flag]) !== "undefined") {
      switch (btn_flag) {
        case 0: muteLtrAry = muteWordAry; break;
        case 1: muteLtrAry = muteLinkAry; break;
        case 2: muteLtrAry = muteTagAry; break;
      }
    }

    // ミュートする文字列が設定されていた時
    if (typeof GM_getValue(muteNameAry[btn_flag]) !== "undefined" && muteLtrAry !== "") {
      alert(btnMsg[3] + muteLtrAry);
    }
    // ミュートする文字列が設定されていなかった時
    else {
      alert(btnMsg[4]);
    }
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
    var j,
        // 対象の各ツイートの大元
        homeTweets = [],
        // リプライツイートの親要素
        replyPrnt,
        // 要素を判断する時に参照する
        tweetPtag;

    $("div[data-promoted='true']").parent().remove(); // プロモーションを消去
    $("div[class='promptbird promptbird-below-black-bar']").remove(); // 人と繋がるバナーを消去

    // ノードが追加された時
    if (typeof addedTweets !== "undefined") {
      homeTweets = addedTweets;
    }
    // ノードが追加されなかった時
    else {
      homeTweets = document.querySelectorAll("li[data-item-type='tweet']");
    }

    for (i = 0; i < homeTweets.length; i++) {
      tweetPrnt = homeTweets[i];
      // <LI>タグ内が空ではない時
      if (typeof tweetPrnt.childNodes[1].childNodes[3] !== "undefined") {
        tweetPtag = tweetPrnt.childNodes[1].childNodes[3].childNodes[3];
      }
      // 返信のツイートである時
      if (typeof tweetPtag === "undefined") {
        // 要素がある場合
        for (j = 3; typeof tweetPrnt.childNodes[1].childNodes[j] !== "undefined"; j++) {
          replyPrnt = tweetPrnt.childNodes[1].childNodes[j];
          if (typeof replyPrnt.childNodes[1] !== "undefined" && replyPrnt.childNodes[1].getAttribute("data-you-block")) {
            tweetPrnt = replyPrnt;
            tweetPtag = replyPrnt.childNodes[1].childNodes[3].childNodes[3];
            tweetElmChk(tweetPtag);
            tweetPrnt = homeTweets[i]; // 値を元に戻す
          }
        }
      }
      // 返信ではない場合
      else {
        tweetElmChk(tweetPtag);
      }
    }
  }

  // ツイート内の要素を判断する
  function tweetElmChk(twtPtag) {
    var k;

    // <P>タグのk番目の要素がある場合
    for (k = 0; typeof twtPtag.childNodes[k] !== "undefined"; k++) {
      tweetElmnt = twtPtag.childNodes[k];
      // <A>タグの時
      if (tweetElmnt.nodeName === "A") {
        // pic.twitter.com
        if ( tweetElmnt.getAttribute("data-pre-embedded") ) {
          tweetElmnt.href = "http://" + tweetElmnt.childNodes[0].nodeValue; // 元のURLでジャンプさせる
          muteLtrFunc(1);
        }
        // pic.twitter.com以外のリンク
        else if ( tweetElmnt.getAttribute("title") ) {
          tweetElmnt.href = tweetElmnt.getAttribute("title");
          muteLtrFunc(1);
        }
        // ハッシュタグ
        else if ( tweetElmnt.getAttribute("data-query-source") ) {
          muteLtrFunc(2);
        }
      }
      // テキストの時
      else if (tweetElmnt.nodeName === "#text") {
        muteLtrFunc(0);
      }
    }
  }

  // ミュートする文字を決定する
  function muteLtrFunc(mute_flag) {
    var l,
        // 各ミュートする文字列を入れる
        muteLtrFuncAry,
        // ミュートする文字列を代入
        muteLtr;

    // ミュートする文字列が設定されていればそれを取得する
    if (typeof GM_getValue(muteNameAry[mute_flag]) !== "undefined") {
      switch (mute_flag) {
        case 0: muteLtrFuncAry = muteWordAry; break;
        case 1: muteLtrFuncAry = muteLinkAry; break;
        case 2: muteLtrFuncAry = muteTagAry; break;
      }
    }

    if (typeof GM_getValue(muteNameAry[mute_flag]) !== "undefined" && GM_getValue(flagAry[mute_flag]) === 1 && muteLtrFuncAry !== "") {
      // 2つ以上単語がある場合
      if (GM_getValue(muteNameAry[mute_flag]).indexOf(",/") !== -1) {
        for (l = 0; l < muteLtrFuncAry.length; l++) {
          muteLtr = new RegExp( preg_quote(muteLtrFuncAry[l]) );
          switch (mute_flag) {
            case 0: muteTextFunc(muteLtr); break;
            case 1: muteLinkFunc(muteLtr); break;
            case 2: muteTagFunc(muteLtr); break;
          }
        }
      }
      // 1つしか単語がない場合
      else {
        muteLtr = new RegExp( preg_quote(muteLtrFuncAry) );
        switch (mute_flag) {
          case 0: muteTextFunc(muteLtr); break;
          case 1: muteLinkFunc(muteLtr); break;
          case 2: muteTagFunc(muteLtr); break;
        }
      }
    }
  }

  // ツイートのテキストについてミュートする
  function muteTextFunc(targetMuteLtr) {
    if ( tweetElmnt.nodeValue.match(targetMuteLtr) ) {
      $(tweetPrnt).remove(); // ツイートの大元を消去
    }
  }
  // ツイートのリンクについてミュートする
  function muteLinkFunc(targetMuteLtr) {
    // pic.twitter.com以外のリンク
    if ( tweetElmnt.getAttribute("title") ) {
      if ( tweetElmnt.getAttribute("title").match(targetMuteLtr) ) {
        $(tweetPrnt).remove();
      }
    }
    // pic.twitter.com
    else if ( tweetElmnt.childNodes[0].nodeValue.match(targetMuteLtr) ) {
      $(tweetPrnt).remove();
    }
  }
  // ツイートのタグについてミュートする
  function muteTagFunc(targetMuteLtr) {
    if ( tweetElmnt.childNodes[1].childNodes[0].nodeValue.match(targetMuteLtr) ) {
      $(tweetPrnt).remove();
    }
  }
});