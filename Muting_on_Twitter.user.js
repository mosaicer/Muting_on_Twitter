// ==UserScript==
// @name        Muting+α on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Muting texts/links/tags on "Twitter Web Client" and changing tweets' style
// @version     3.0
// @include     https://twitter.com/
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==
(function () {
  var Init = function() {
        this.userLang = window.navigator.language === "ja" ? "ja" : "en";
        this.menu_jp = {
          // オブジェクトは、キー:フラグ名+"Change",値:メニューの関数
          mute_text_flag: ["ツイート本文についてのミュートを", {}],
          mute_link_flag: ["リンクについてのミュートを", {}],
          mute_tag_flag: ["ハッシュタグについてのミュートを", {}],
          mute_userId_flag: ["ユーザーIDについてのミュートを", {}],
          style_flag: ["各ツイートの装飾を", {}]
          // lang_flag: ["英語に切り替える", {}]
        };
        this.menu_en = {
          // オブジェクトは、キー:フラグ名+"Change",値:メニューの関数
          mute_text_flag: [" mute for texts in tweet", {}],
          mute_link_flag: [" mute for links in tweet", {}],
          mute_tag_flag: [" mute for hashtags in tweet", {}],
          mute_userId_flag: [" mute for userIDs in tweet", {}],
          style_flag: [" changing tweet style", {}]
          // lang_flag: ["Change the language you're using to Japanese", {}]
        };
        this.msgFlag = false;
        this.msg = "";
        this.muteNameArray = {
          mute_words: [],
          mute_links: [],
          mute_tags: [],
          mute_ids: []
        };
      },
      setting,
      HeaderStruct = function() {
        this.contentHeader = document.querySelector(".content-header");
        this.headerInner = document.querySelector(".header-inner");
        this.btbParentNode = document.querySelector(".container");
        this.openClose_msg = {
          ja: "▼フォーム欄の開閉 ",
          en: "▼Open/Close input form "
        };
        this.openClose_btn = document.createElement("span");
        this.pageTop_msg = {
          ja: "▲ページの先頭へ",
          en: "▲Jump at the top of page"
        };
        this.pageTop_btn = document.createElement("span");
        this.btnAry = {
          ja: ["追加", "削除", "確認"],
          en: ["Add", "Del", "Confirm"]
        };
        this.placeholderAry = {
          ja: [
                "ツイート本文についてミュートする文字を入力してください",
                "リンクについてミュートする文字を入力してください",
                "ハッシュタグについてミュートする文字を入力してください",
                "ユーザーIDについてミュートする文字を入力してください"
              ],
          en: [
                "Please input letters you want mute for texts in tweet",
                "Please input letters you want mute for links in tweet",
                "Please input letters you want mute for hashtags in tweet",
                "Please input letters you want mute for userIDs in tweet"
              ]
        };
      },
      header,
      ButtonSet = function() {
        this.muteFlag = 0;
        this.pluralFlag = 0;
        this.btnFlag = "";
        this.muteListTemp = "";
        this.altMsgAry = {
          ja: [
                "ミュートしたい文字列はすでに設定されています",
                "ミュートしたい文字列は削除できません",
                "ミュートしたい文字列は設定した文字列とマッチしませんでした",
                "↓ミュートする文字列をカンマ区切りで表示しています↓\n\n",
                "ミュートする文字列が設定されていません",
                "申し訳ないですが、ミュートする文字列に,/は使うことができません"
              ],
          en: [
                "The word is already set for mute word",
                "The word can not be deleted",
                "The word is not set for mute word",
                "↓The mute words separated by conmma↓\n\n",
                "The mute words are not found",
                "Sorry, the mute words which contains the word ',/' can not be set"
              ]
        };
      },
      buttonAction,
      MuteFeatures = function() {
        this.homeTweets = "";
        this.tweetPtag = "";
        this.replyPrnt = ""; // リプライツイートの親要素
        this.flag = "";
        this.i = 0;
        this.j = 0;
        // 要素を判断する時に参照する
        this.tweetPrnt = "";
        this.tweetElement = "";
      },
      muteAction,
      key = "",
      // 各ツイートを装飾する、コンストラクタではない
      tweetStyleChange = function() {
        // ツイートの文字を太字に
        Array.prototype.slice.call(document.querySelectorAll("[class='js-tweet-text tweet-text']")).forEach(
          function (targetNode) {
            targetNode.style.fontWeight = "bold";
          }
        );
        // ユーザー名を赤く
        Array.prototype.slice.call(document.querySelectorAll("[class*='js-action-profile-name']")).forEach(
          function (targetNode) {
            targetNode.style.color = "red";
          }
        );
        // 時間経過を青く
        Array.prototype.slice.call(document.querySelectorAll("[data-long-form='true']")).forEach(
          function (targetNode) {
            targetNode.style.color = "blue";
          }
        );
        // リンクは必ず新しいタブに飛ばす
        Array.prototype.slice.call(document.querySelectorAll("[class='twitter-timeline-link']")).forEach(
          function (targetNode) {
            targetNode.setAttribute("target", "_blank");
          }
        );
      },
      // MutationObserver用
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      observer;

  Init.prototype = {
    // アクセス時の処理
    accessSet: function() {
      // if (GM_getValue("lang_flag") === true) {
      if (this.userLang === "ja") {
        for (key in this.menu_jp) {
          if (this.menu_jp.hasOwnProperty(key)) {
            // 初アクセス時のみに実行、フラグの設定
            if (typeof GM_getValue(key) === "undefined") {
              // if (key !== "lang_flag") { // 引用符必要?
                GM_setValue(key, true);
              // } else {
              //   if (window.navigator.language === "ja") {
              //     GM_setValue(key, true);
              //   } else {
              //     GM_setValue(key, false);
              //   }
              // }
            }
            // ユーザースクリプトコマンドメニューを構成
            // if (key !== "lang_flag") { // 引用符必要?
              this.msgFlag = GM_getValue(key) === true ? "無効" : "有効";
              this.msg = this.menu_jp[key][0] + this.msgFlag + "にする";
            // } else {
            //   this.msg = this.menu_jp[key][0];
            // }
            GM_registerMenuCommand(this.msg, this.featuresChg.bind(this.menu_jp[key][1][key + "Change"], key));
          }
        }
      } else {
        for (key in this.menu_en) {
          if (this.menu_jp.hasOwnProperty(key)) {
            // 初アクセス時のみに実行、フラグの設定
            if (typeof GM_getValue(key) === "undefined") {
              // if (key !== "lang_flag") { // 引用符必要?
                GM_setValue(key, true);
              // } else {
              //   if (window.navigator.language === "ja") {
              //     GM_setValue(key, true);
              //   } else {
              //     GM_setValue(key, false);
              //   }
              // }
            }
            // ユーザースクリプトコマンドメニューを構成
            // if (key !== "lang_flag") { // 引用符必要?
              this.msgFlag = GM_getValue(key) === true ? "Disable" : "Enable";
              this.msg = this.msgFlag + this.menu_en[key][0];
            // } else {
            //   this.msg = this.menu_en[key][0];
            // }
            GM_registerMenuCommand(this.msg, this.featuresChg.bind(this.menu_en[key][1][key + "Change"], key));
          }
        }
      }
      for (key in this.muteNameArray) {
        if (this.muteNameArray.hasOwnProperty(key) && typeof GM_getValue(key) !== "undefined") {
          if (GM_getValue(key).indexOf(",/") >= 0) {
            this.muteNameArray[key] = GM_getValue(key).split(",/");
          } else {
            this.muteNameArray[key].push(GM_getValue(key));
          }
        }
      }
      if (typeof GM_getValue("form_flag") === "undefined") {
        GM_setValue("form_flag", true);
      }
      if (typeof GM_getValue("style_flag") === "undefined") {
        GM_setValue("style_flag", true);
      }
    },
    // ユーザースクリプトコマンドメニューで実行する関数、有効/無効の切り替え
    featuresChg: function(flagName) {
      this.msgFlag = GM_getValue(flagName) === true ? false : true;
      GM_setValue(flagName, this.msgFlag);
      location.reload();
    }
  };

  HeaderStruct.prototype.styleSet = function () {
    // ヘッダーのスタイルを変更する
    this.contentHeader.style.borderStyle = "hidden";
    this.headerInner.style.height = "120px";
    this.headerInner.style.backgroundColor = "transparent";
    // ページの先頭へジャンプできるボタンを置く
    this.pageTop_btn.setAttribute("id", "move_top");
    this.pageTop_btn.style.color = "blue";
    this.pageTop_btn.style.cursor = "pointer";
    this.pageTop_btn.appendChild(document.createTextNode(this.pageTop_msg[setting.userLang]));
    this.btbParentNode.insertBefore(this.pageTop_btn, document.querySelector("[role='navigation']"));
    // ページのヘッダーのツイッターアイコンの横にフォーム欄の開閉を操作できるボタンを置く
    this.openClose_btn.setAttribute("id", "open_close");
    this.openClose_btn.style.color = "red";
    this.openClose_btn.style.cursor = "pointer";
    this.openClose_btn.appendChild(document.createTextNode(this.openClose_msg[setting.userLang]));
    this.btbParentNode.insertBefore(this.openClose_btn, document.getElementById("move_top"));
    // 各テキストボックスとボタンを設置
    document.getElementById("content-main-heading").innerHTML = "<form onsubmit='return false;'>" +
        "<input type='text' id='mTextForm' class='form_btn' value='' placeholder='" +
        this.placeholderAry[setting.userLang][0] + "' style='width: 400px;'>" +
        "<input type='button' id='mWordAdd' class='form_btn' value='" + this.btnAry[setting.userLang][0] + "'>" +
        "<input type='button' id='mWordRmv' class='form_btn' value='" + this.btnAry[setting.userLang][1] + "'>" +
        "<input type='button' id='mWordConf' value='" + this.btnAry[setting.userLang][2] + "' float='left'>" +
        "</form><form onsubmit='return false;'>" +
        "<input type='text' id='mLinkForm' class='form_btn' value='' placeholder='" +
        this.placeholderAry[setting.userLang][1] + "' style='width: 400px;'>" +
        "<input type='button' id='mLinkAdd' class='form_btn' value='" + this.btnAry[setting.userLang][0] + "'>" +
        "<input type='button' id='mLinkRmv' class='form_btn' value='" + this.btnAry[setting.userLang][1] + "'>" +
        "<input type='button' id='mLinkConf' value='" + this.btnAry[setting.userLang][2] + "' float='left'>" +
        "</form><form onsubmit='return false;'>" +
        "<input type='text' id='mTagForm' class='form_btn' value='' placeholder='" +
        this.placeholderAry[setting.userLang][2] + "' style='width: 400px;'>" +
        "<input type='button' id='mTagAdd' class='form_btn' value='" + this.btnAry[setting.userLang][0] + "'>" +
        "<input type='button' id='mTagRmv' class='form_btn' value='" + this.btnAry[setting.userLang][1] + "'>" +
        "<input type='button' id='mTagConf' value='" + this.btnAry[setting.userLang][2] + "' float='left'>" +
        "</form><form onsubmit='return false;'>" +
        "<input type='text' id='mIdForm' class='form_btn' value='' placeholder='" +
        this.placeholderAry[setting.userLang][3] + "' style='width: 400px;'>" +
        "<input type='button' id='mIdAdd' class='form_btn' value='" + this.btnAry[setting.userLang][0] + "'>" +
        "<input type='button' id='mIdRmv' class='form_btn' value='" + this.btnAry[setting.userLang][1] + "'>" +
        "<input type='button' id='mIdConf' value='" + this.btnAry[setting.userLang][2] + "' float='left'>" +
        "</form>";
    Array.prototype.slice.call(document.querySelectorAll(".form_btn")).forEach(
      function (targetNode) {
        targetNode.setAttribute("float", "left");
        targetNode.style.marginRight = "10px";
      }
    );
    // フォーム欄のフラグをチェック
    if (GM_getValue("form_flag") === false) {
      this.contentHeader.style.display = "none";
    }

    // ボタンイベント--------------------------------------------------------------------------------------
    // フォーム欄を…
    document.getElementById("open_close").addEventListener(
      "click",
      function() {
        if (GM_getValue("form_flag") === true) {
          header.contentHeader.style.display = "none"; // 閉じる
          GM_setValue("form_flag", false);
        } else {
          header.contentHeader.style.display = "block"; // 開く
          GM_setValue("form_flag", true);
        }
      },
      false
    );
    // ページの先頭へジャンプする
    document.getElementById("move_top").addEventListener(
      "click",
      function() {
        window.scroll(0, 0);
      },
      false
    );
    // ツイートのテキストについて
    document.getElementById("mWordAdd").addEventListener(
      "click",
      function() {
        buttonAction.addMuteLtr("mute_words", document.getElementById("mTextForm").value);
      },
      false
    );
    document.getElementById("mWordRmv").addEventListener(
      "click",
      function() {
        buttonAction.delMuteLtr("mute_words", document.getElementById("mTextForm").value);
      },
      false
    );
    document.getElementById("mWordConf").addEventListener(
      "click",
      function() {
        buttonAction.confMuteLtr("mute_words");
      },
      false
    );
    // ツイートのリンクについて
    document.getElementById("mLinkAdd").addEventListener(
      "click",
      function() {
        buttonAction.addMuteLtr("mute_links", document.getElementById("mLinkForm").value);
      },
      false
    );
    document.getElementById("mLinkRmv").addEventListener(
      "click",
      function() {
        buttonAction.delMuteLtr("mute_links", document.getElementById("mLinkForm").value);
      },
      false
    );
    document.getElementById("mLinkConf").addEventListener(
      "click",
      function() {
        buttonAction.confMuteLtr("mute_links");
      },
      false
    );
    // ツイートのタグについて
    document.getElementById("mTagAdd").addEventListener(
      "click",
      function() {
        buttonAction.addMuteLtr("mute_tags", document.getElementById("mTagForm").value);
      },
      false
    );
    document.getElementById("mTagRmv").addEventListener(
      "click",
      function() {
        buttonAction.delMuteLtr("mute_tags", document.getElementById("mTagForm").value);
      },
      false
    );
    document.getElementById("mTagConf").addEventListener(
      "click",
      function() {
        buttonAction.confMuteLtr("mute_tags");
      },
      false
    );
    // ツイートのユーザーIDについて
    document.getElementById("mIdAdd").addEventListener(
      "click",
      function() {
        buttonAction.addMuteLtr("mute_ids", document.getElementById("mIdForm").value);
      },
      false
    );
    document.getElementById("mIdRmv").addEventListener(
      "click",
      function() {
        buttonAction.delMuteLtr("mute_ids", document.getElementById("mIdForm").value);
      },
      false
    );
    document.getElementById("mIdConf").addEventListener(
      "click",
      function() {
        buttonAction.confMuteLtr("mute_ids");
      },
      false
    );
    // ----------------------------------------------------------------------------------------------------
  };

  ButtonSet.prototype = {
    // ミュートする文字列を追加する
    addMuteLtr: function (btn_flag, theLetter) {
      this.btnFlag = btn_flag;
      this.pluralFlag = 0;
      if (theLetter !== "") {
        if (theLetter.indexOf(",/,/") < 0) {
          if (theLetter.indexOf(",/") >= 0) {
            this.pluralFlag = 1;
            this.muteListTemp = [];
            theLetter.split(",/").forEach(this.addFunc, buttonAction);
          } else {
            this.muteListTemp = "";
            this.addFunc(theLetter);
          }
          if (
            this.muteListTemp[0] !== "" && this.pluralFlag === 1 ||
            this.muteListTemp !== "" && this.pluralFlag === 0
          ) {
            if (this.pluralFlag === 0) {
              GM_setValue(btn_flag, this.muteListTemp);
            } else {
              if (typeof GM_getValue(btn_flag) === "undefined" || setting.muteNameArray[btn_flag][0] === "") {
                GM_setValue(btn_flag, this.muteListTemp.join(",/"));
              } else {
                GM_setValue(btn_flag, setting.muteNameArray[btn_flag].join(",/") + ",/" + this.muteListTemp.join(",/"));
              }
            }
            location.href = "https://twitter.com/";
          }
        } else {
          alert(this.altMsgAry[setting.userLang][5]);
        }
      }
    },
    addFunc: function (targetLtr) {
      this.targetText = targetLtr;
      this.muteFlag = 0;
      // 未入力の場合ではない時
      if (this.targetText !== "") {
        // 初めてor空に、追加する時
        if (typeof GM_getValue(this.btnFlag) === "undefined" || setting.muteNameArray[this.btnFlag][0] === "") {
          if (this.pluralFlag === 1) {
            this.muteListTemp.push(this.targetText);
          } else {
            this.muteListTemp = this.targetText;
          }
        }
        // すでに入ってる状態の時
        else {
          setting.muteNameArray[this.btnFlag].forEach(this.completeComp, buttonAction);
          if (this.muteFlag === 0) {
            if (this.pluralFlag === 1) {
              this.muteListTemp.push(this.targetText);
            } else {
              this.muteListTemp = setting.muteNameArray[this.btnFlag].join(",/") + ",/" + this.targetText;
            }
          } else {
            alert(this.altMsgAry[setting.userLang][0]);
          }
        }
      }
    },
    // ミュートする文字列を削除する
    delMuteLtr: function (btn_flag, theLetter) {
      this.btnFlag = btn_flag;
      this.muteListTemp = setting.muteNameArray[btn_flag];
      if (theLetter !== "") {
        if (theLetter.indexOf(",/,/") < 0) {
          if (theLetter.indexOf(",/") >= 0) {
            theLetter.split(",/").forEach(this.deleteFunc, buttonAction);
          } else {
            this.deleteFunc(theLetter);
          }
          if (this.muteListTemp !== setting.muteNameArray[btn_flag]) {
            GM_setValue(this.btnFlag, this.muteListTemp.join(",/"));
            location.href = "https://twitter.com/";
          }
        } else {
          alert(this.altMsgAry[setting.userLang][5]);
        }
      }
    },
    deleteFunc: function (targetLtr) {
      this.targetText = targetLtr;
      this.muteFlag = 0;
      // 未入力ではない時
      if (this.targetText !== "") {
        // 文字列が入ってない時
        if (typeof GM_getValue(this.btnFlag) === "undefined" || this.muteListTemp[0] === "") {
          alert(this.altMsgAry[setting.userLang][1]);
        }
        // 文字列がセットされている時
        else {
          this.muteListTemp.forEach(this.completeComp, buttonAction);
          if (this.muteFlag === 1) {
            this.muteListTemp = this.muteListTemp.filter(this.filterFunc, buttonAction);
          } else {
            alert(this.altMsgAry[setting.userLang][2]);
          }
        }
      }
    },
    // ミュートする文字列を確認する
    confMuteLtr: function (btn_flag) {
      // ミュートする文字列が設定されていた時
      if (typeof GM_getValue(btn_flag) !== "undefined" && setting.muteNameArray[btn_flag][0] !== "") {
        alert(this.altMsgAry[setting.userLang][3] + setting.muteNameArray[btn_flag]);
      }
      // ミュートする文字列が設定されていなかった時
      else {
        alert(this.altMsgAry[setting.userLang][4]);
      }
    },
    completeComp: function (targetLtr) {
      if (this.muteFlag === 0 && this.targetText === targetLtr) {
        this.muteFlag = 1;
      }
    },
    filterFunc: function (targetLtr) {
      return (this.targetText !== targetLtr);
    }
  };

  MuteFeatures.prototype = {
    // ミュート機能を始動
    muteTweet: function (addedTweets) {
      // プロモーションを消去
      if (document.querySelector("[data-promoted='true']") !== null) {
        document.querySelector("[data-promoted='true']").parentNode.style.display = "none";
      }
      // 人と繋がるバナーを消去
      // document.querySelector("[class='promptbird promptbird-below-black-bar']").style.display = "none";

      // ノードが追加された時
      if (typeof addedTweets !== "undefined") {
        this.homeTweets = Array.prototype.slice.call(addedTweets);
      }
      // ノードが追加されなかった時
      else {
        this.homeTweets = Array.prototype.slice.call(document.querySelectorAll("[data-item-type='tweet']"));
      }
      this.homeTweets.forEach(this.nodeCheck, muteAction);
    },
    // ツイートが返信かどうかなどの判断
    nodeCheck: function (targetNode) {
      this.tweetPrnt = targetNode;
      // <LI>タグ内が空ではない時
      if (typeof this.tweetPrnt.childNodes[1].childNodes[3] !== "undefined") {
        this.tweetPtag = this.tweetPrnt.childNodes[1].childNodes[3].childNodes[3];
      }
      // 返信のツイートである時
      if (typeof this.tweetPtag === "undefined") {
        // 要素がある場合
        for (this.i = 3; typeof this.tweetPrnt.childNodes[1].childNodes[this.i] !== "undefined"; this.i++) {
          this.replyPrnt = this.tweetPrnt.childNodes[1].childNodes[this.i];
          if (
            typeof this.replyPrnt.childNodes[1] !== "undefined" &&
            this.replyPrnt.childNodes[1].getAttribute("data-you-block")
          ) {
            this.tweetPrnt = this.replyPrnt; // リプライを消すときに参照する親ノードを変更
            this.tweetPtag = this.replyPrnt.childNodes[1].childNodes[3].childNodes[3];
            this.tweetElmCheck();
            this.tweetPrnt = targetNode; // 値を元に戻す
          }
        }
      }
      // 返信ではない場合
      else {
        this.tweetElmCheck();
      }
    },
    // ツイート内の要素を判断
    tweetElmCheck: function() {
      // <P>タグのthis.j番目の要素がある場合
      for (this.j = 0; typeof this.tweetPtag.childNodes[this.j] !== "undefined"; this.j++) {
        this.tweetElement = this.tweetPtag.childNodes[this.j];
        // <A>タグの時
        if (this.tweetElement.nodeName === "A") {
          // pic.twitter.com
          if (this.tweetElement.getAttribute("data-pre-embedded")) {
            this.tweetElement.href = "http://" + this.tweetElement.childNodes[0].nodeValue; // 元のURLでジャンプさせる
            this.muteLtrCheck("mute_links");
          }
          // pic.twitter.com以外のリンク
          else if (this.tweetElement.getAttribute("title")) {
            this.tweetElement.href = this.tweetElement.getAttribute("title");
            this.muteLtrCheck("mute_links");
          }
          // ハッシュタグ
          else if (this.tweetElement.getAttribute("data-query-source")) {
            this.muteLtrCheck("mute_tags");
          }
          // ユーザーID
          else if (this.tweetElement.childNodes[0].childNodes[0].nodeValue === "@") {
            this.muteLtrCheck("mute_ids");
          }
        }
        // テキストの時
        else if (this.tweetElement.nodeName === "#text") {
          this.muteLtrCheck("mute_words");
        }
      }
    },
    // ミュートする文字を決定する
    muteLtrCheck: function (mute_flag) {
      if (typeof GM_getValue(mute_flag) !== "undefined" && setting.muteNameArray[mute_flag][0] !== "") {
        this.flag = mute_flag;
        setting.muteNameArray[mute_flag].forEach(this.muteFunc, muteAction);
      }
    },
    // ツイートの各対象についてミュートする
    muteFunc: function (targetLtr) {
      switch (this.flag) {
        case "mute_words":
          if (GM_getValue("mute_text_flag") === true && this.tweetElement.nodeValue.indexOf(targetLtr) >= 0) {
            this.tweetPrnt.style.display = "none"; // ツイートの大元を消去
          }
          break;
        case "mute_links":
          if (GM_getValue("mute_link_flag") === true) {
            // pic.twitter.com以外のリンク
            if (this.tweetElement.getAttribute("title")) {
              if (this.tweetElement.getAttribute("title").indexOf(targetLtr) >= 0) {
                this.tweetPrnt.style.display = "none";
              }
            }
            // pic.twitter.com
            else if (this.tweetElement.childNodes[0].nodeValue.indexOf(targetLtr) >= 0) {
              this.tweetPrnt.style.display = "none";
            }
          }
          break;
        case "mute_tags":
          if (
            GM_getValue("mute_tag_flag") === true &&
            this.tweetElement.childNodes[1].childNodes[0].nodeValue.indexOf(targetLtr) >= 0
          ) {
            this.tweetPrnt.style.display = "none";
          }
          break;
        case "mute_ids":
          if (
            GM_getValue("mute_userId_flag") === true &&
            this.tweetElement.childNodes[1].childNodes[0].nodeValue.indexOf(targetLtr) >= 0
          ) {
            this.tweetPrnt.style.display = "none";
          }
          break;
      }
    }
  };

  // インスタンス化
  setting = new Init();
  header = new HeaderStruct();
  buttonAction = new ButtonSet();
  muteAction = new MuteFeatures();

  setting.accessSet(); // DBの初期設定、メニューの構築、ミュートリストの取得
  header.styleSet(); // ヘッダー部分の構築
  muteAction.muteTweet(); // ツイートのミュート処理

  if (GM_getValue("style_flag") === true) {
    tweetStyleChange(); // ツイートの装飾
  }

  // 追加のページの読み込みを監視して実行-----------------------------------------------------------------------
  observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (GM_getValue("style_flag") === true) {
        tweetStyleChange();
      }
      // 空じゃない時
      if (mutation.addedNodes.length !== 0) {
        muteAction.muteTweet(mutation.addedNodes); // 追加されたノードを渡す
      }
    });
  });
  observer.observe(document.getElementById("stream-items-id"), {childList: true } );
  // ------------------------------------------------------------------------------------------------------------
})();