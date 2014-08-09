// ==UserScript==
// @name        Muting+α on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Muting texts/links/tags/userIDs on "Twitter Web Client" and changing tweets' style
// @version     4.0
// @include     https://twitter.com/
// @include     https://twitter.com/search?*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// ==/UserScript==
(function () {
  var Init = function() {
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
        this.previousNode = pageURL === "https://twitter.com/" ?
          document.querySelector("[class='DashboardProfileCard  module']") :
          document.querySelector("[class='module'][role='navigation']");
        this.parentFormNode = pageURL === "https://twitter.com/" ?
          document.querySelector("[class='dashboard dashboard-left ']") :
          document.querySelector("[class='dashboard dashboard-left']");
        this.formNode = document.createElement("div");
        this.formContainer = "";
        this.headerWidth = pageURL === "https://twitter.com/" ? 418 : 440;
        this.openClose_msg = {
          ja: "▶ フォーム欄の開閉 ◀",
          en: "▶ Open/Close input form ◀"
        };
        this.openClose_btn = document.createElement("div");
        this.btnAry = {
          ja: ["追加", "削除", "確認"],
          en: ["Add", "Del", "Conf"]
        };
        this.placeholderAry = {
          ja: [
                "ミュートする文字を入力してください",
                "テキスト",
                "リンク",
                "ハッシュタグ",
                "ユーザーID",
                "ミュートするタイプを選んでください"
              ],
          en: [
                "Please input letters you want mute in tweet",
                "texts",
                "links",
                "hashtags",
                "userIDs",
                "Please choose a type of muting"
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
      pageURL = location.href,
      userLang = window.navigator.language === "ja" ? "ja" : "en",
      // 各ツイートを装飾する、コンストラクタではない
      tweetStyleChange = function() {
        // ツイートの文字を太字に
        if (pageURL === "https://twitter.com/") {
          Array.prototype.slice.call(document.querySelectorAll("[class='js-tweet-text tweet-text']")).forEach(
            function (targetNode) {
              targetNode.style.fontWeight = "bold";
            }
          );
        }
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
      if (userLang === "ja") {
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
      location.href = pageURL;
    }
  };

  HeaderStruct.prototype.styleSet = function () {
    // ヘッダーのスタイルを変更する
    if (pageURL === "https://twitter.com/") {
      this.contentHeader.style.borderStyle = "hidden";
      this.headerInner.style.height = "65px";
      this.headerInner.style.backgroundColor = "transparent";
    }
    // フォーム欄の開閉を操作できるボタンを置く
    this.openClose_btn.setAttribute("id", "open_close");
    this.openClose_btn.style.backgroundColor = "#FFD700";
    this.openClose_btn.style.cursor = "pointer";
    this.openClose_btn.style.width = "290px";
    this.openClose_btn.style.textAlign = "center";
    this.openClose_btn.style.marginBottom = "15px";
    this.openClose_btn.appendChild(document.createTextNode(this.openClose_msg[userLang]));
    this.parentFormNode.insertBefore(this.openClose_btn, this.previousNode); // 検索とホームで別のノードを参照する必要がある
    // 各テキストボックスとボタンを設置
    this.formContainer = "<form onsubmit='return false;'>" +
          "<input type='text' id='mLtrForm' class='form_btn' value='' placeholder='" +
          this.placeholderAry[userLang][0] + "' style='width: " + this.headerWidth + "px;'>" +
          "<input type='button' id='mLtrAdd' class='form_btn' value='" + this.btnAry[userLang][0] + "'>" +
          "<input type='button' id='mLtrRmv' class='form_btn' value='" + this.btnAry[userLang][1] + "'>" +
          "<input type='button' id='mLtrConf' value='" + this.btnAry[userLang][2] + "' style='float:right; color:black;'>" +
          "</form><div style='background-color:white; margin-top:8px; font-size:12px; color:black; height:23px;'>" +
          "<span style='color:green;'>" + this.placeholderAry[userLang][5] + "：　</span>" +
          "<label style='margin-right: 17px;'><input type='radio' name='muteLetter' value='mute_words' checked>" +
          this.placeholderAry[userLang][1] + "</label>" +
          "<label style='margin-right: 17px;'><input type='radio' name='muteLetter' value='mute_links'>" +
          this.placeholderAry[userLang][2] + "</label>" +
          "<label style='margin-right: 17px;'><input type='radio' name='muteLetter' value='mute_tags'>" +
          this.placeholderAry[userLang][3] + "</label>" +
          "<label style='margin-right: 17px;'><input type='radio' name='muteLetter' value='mute_ids'>" +
          this.placeholderAry[userLang][4] + "</label></div>";
    if (pageURL === "https://twitter.com/") {
      document.getElementById("content-main-heading").innerHTML = this.formContainer;
    } else {
      this.formNode.style.marginBottom = "10px";
      this.formNode.style.textAlign = "center";
      this.formNode.innerHTML = this.formContainer;
      document.getElementById("timeline").insertBefore(this.formNode, this.contentHeader);
    }
    Array.prototype.slice.call(document.querySelectorAll(".form_btn")).forEach(
      function (targetNode) {
        targetNode.setAttribute("float", "left");
        targetNode.style.marginRight = "10px";
        targetNode.style.color = "black";
      }
    );
    // フォーム欄のフラグをチェック
    if (GM_getValue("form_flag") === false) {
      if (pageURL === "https://twitter.com/") {
        this.contentHeader.style.display = "none";
      } else {
        this.formNode.style.display = "none";
      }
    }
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
          if (this.muteListTemp[0] !== "" && this.pluralFlag === 1 || this.muteListTemp !== "" && this.pluralFlag === 0) {
            if (this.pluralFlag === 0) {
              GM_setValue(btn_flag, this.muteListTemp);
            } else {
              if (typeof GM_getValue(btn_flag) === "undefined" || setting.muteNameArray[btn_flag][0] === "") {
                GM_setValue(btn_flag, this.muteListTemp.join(",/"));
              } else {
                GM_setValue(btn_flag, setting.muteNameArray[btn_flag].join(",/") + ",/" + this.muteListTemp.join(",/"));
              }
            }
            location.href = pageURL;
          }
        } else {
          alert(this.altMsgAry[userLang][5]);
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
            alert(this.altMsgAry[userLang][0]);
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
            location.href = pageURL;
          }
        } else {
          alert(this.altMsgAry[userLang][5]);
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
          alert(this.altMsgAry[userLang][1]);
        }
        // 文字列がセットされている時
        else {
          this.muteListTemp.forEach(this.completeComp, buttonAction);
          if (this.muteFlag === 1) {
            this.muteListTemp = this.muteListTemp.filter(this.filterFunc, buttonAction);
          } else {
            alert(this.altMsgAry[userLang][2]);
          }
        }
      }
    },
    // ミュートする文字列を確認する
    confMuteLtr: function (btn_flag) {
      // ミュートする文字列が設定されていた時
      if (typeof GM_getValue(btn_flag) !== "undefined" && setting.muteNameArray[btn_flag][0] !== "") {
        alert(this.altMsgAry[userLang][3] + setting.muteNameArray[btn_flag]);
      }
      // ミュートする文字列が設定されていなかった時
      else {
        alert(this.altMsgAry[userLang][4]);
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
      // if (document.querySelector("[class='promptbird promptbird-below-black-bar']") !== null) {
      //   document.querySelector("[class='promptbird promptbird-below-black-bar']").style.display = "none";
      // }

      // ノードが追加された時
      if (typeof addedTweets !== "undefined") {
        this.homeTweets = Array.prototype.slice.call(addedTweets);
      }
      // ノードが追加されなかった時
      else {
        this.homeTweets = Array.prototype.slice.call(document.querySelectorAll("[data-item-type]"));
      }
      this.homeTweets.forEach(this.nodeCheck, muteAction);
    },
    // ツイートが返信かどうかなどの判断
    nodeCheck: function (targetNode) {
      var tweetPtag;
      if (targetNode.hasAttribute("data-item-type")) {
        this.tweetPrnt = targetNode;
        // <LI>タグ内が空ではない時
        if (typeof this.tweetPrnt.childNodes[1].childNodes[3] !== "undefined") {
          tweetPtag = this.tweetPrnt.childNodes[1].childNodes[3].childNodes[3];
        }
        // 返信のツイートである時
        if (typeof tweetPtag === "undefined") {
          // ホームの場合
          if (pageURL === "https://twitter.com/") {
            // 要素がある場合
            for (this.i = 3; typeof this.tweetPrnt.childNodes[1].childNodes[this.i] !== "undefined"; this.i++) {
              this.replyPrnt = this.tweetPrnt.childNodes[1].childNodes[this.i];
              if (
                typeof this.replyPrnt.childNodes[1] !== "undefined" &&
                this.replyPrnt.childNodes[1].getAttribute("data-you-block")
              ) {
                this.tweetPrnt = this.replyPrnt; // リプライを消すときに参照する親ノードを変更
                tweetPtag = this.replyPrnt.childNodes[1].childNodes[3].childNodes[3];
                this.tweetElmCheck(tweetPtag);
                this.tweetPrnt = targetNode; // 値を元に戻す
              }
            }
          }
          // 検索ページの時、返信は無いため気にする必要はなくこのイレギュラーなツイートのみを判断する
          else {
            // すべてのトップで余計なノードを通さない
            if (
              this.tweetPrnt.childNodes[1].className !== "account-group js-account-group js-user-profile-link" &&
              this.tweetPrnt.childNodes[1].className !== "avatar size32 js-user-profile-link"
            ) {
              tweetPtag = this.tweetPrnt.childNodes[1].childNodes[1].childNodes[1].childNodes[3].childNodes[3];
              this.tweetElmCheck(tweetPtag);
            }
          }
        }
        // 返信ではない場合
        else {
          // タイムライン検索の時
          if (tweetPtag.className === "fullname js-action-profile-name show-popup-with-id") {
            tweetPtag = this.tweetPrnt.childNodes[1].childNodes[5];
          }
          this.tweetElmCheck(tweetPtag);
        }
      }
    },
    // ツイート内の要素を判断
    tweetElmCheck: function(twtPtag) {
      // <P>タグのthis.j番目の要素がある場合
      for (this.j = 0; typeof twtPtag.childNodes[this.j] !== "undefined"; this.j++) {
        this.tweetElement = twtPtag.childNodes[this.j];
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
        // テキストか<STRONG>タグの時
        else if (this.tweetElement.nodeName === "#text" || this.tweetElement.nodeName === "STRONG") {
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
      var nodeValTemp = "";
      switch (this.flag) {
        case "mute_words":
          if (GM_getValue("mute_text_flag") === true) {
            // テキスト
            if (this.tweetElement.nodeName === "#text") {
              if (this.tweetElement.nodeValue.indexOf(targetLtr) >= 0) {
                this.tweetPrnt.style.display = "none";
              }
            }
            // <STRONG>タグ
            else {
              // 前のテキストノードがあれば加える
              if (this.tweetElement.previousSibling !== null && this.tweetElement.previousSibling.nodeName === "#text") {
                nodeValTemp = this.tweetElement.previousSibling.nodeValue;
              }
              // <STRONG>タグ内のテキストを取得
              nodeValTemp += this.tweetElement.childNodes[0].nodeValue;
              // 後ろのテキストノードがあれば加える
              if (this.tweetElement.nextSibling !== null && this.tweetElement.nextSibling.nodeName === "#text") {
                nodeValTemp += this.tweetElement.nextSibling.nodeValue;
              }
              if (nodeValTemp.indexOf(targetLtr) >= 0) {
                this.tweetPrnt.style.display = "none";
              }
            }
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
            else if (this.tweetElement.innerHTML.replace(/<strong>|<\/strong>/g, "").indexOf(targetLtr) >= 0) {
              this.tweetPrnt.style.display = "none";
            }
          }
          break;
        case "mute_tags":
          if (
            GM_getValue("mute_tag_flag") === true &&
            this.tweetElement.childNodes[1].innerHTML.replace(/<strong>|<\/strong>/g, "").indexOf(targetLtr) >= 0
          ) {
            this.tweetPrnt.style.display = "none";
          }
          break;
        case "mute_ids":
          if (
            GM_getValue("mute_userId_flag") === true &&
            this.tweetElement.childNodes[1].innerHTML.replace(/<strong>|<\/strong>/g, "").indexOf(targetLtr) >= 0
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

  // ボタンイベント---------------------------------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    var tgtNode = e.target; // クリックしたノード
    switch (tgtNode.id) {
      // フォーム欄の開閉
      case "open_close":
        if (GM_getValue("form_flag") === true) {
          if (pageURL === "https://twitter.com/") {
            header.contentHeader.style.display = "none";
          } else {
            header.formNode.style.display = "none";
          }
          GM_setValue("form_flag", false);
        } else {
          if (pageURL === "https://twitter.com/") {
            header.contentHeader.style.display = "block";
          } else {
            header.formNode.style.display = "block";
          }
          GM_setValue("form_flag", true);
        }
        break;
      // ミュートする文字列の追加
      case "mLtrAdd":
        buttonAction.addMuteLtr(document.querySelector("[checked]").value, document.getElementById("mLtrForm").value);
        break;
      // ミュートする文字列の削除
      case "mLtrRmv":
        buttonAction.delMuteLtr(document.querySelector("[checked]").value, document.getElementById("mLtrForm").value);
        break;
      // ミュートする文字列の確認
      case "mLtrConf":
        buttonAction.confMuteLtr(document.querySelector("[checked]").value);
        break;
      default:
        // どれに対してミュートするかラジオボタンにチェック
        if (tgtNode.name === "muteLetter") {
          if (document.querySelector("[checked]")) { // 2つ以上付かないように前のチェックを消去
            document.querySelector("[checked]").removeAttribute("checked");
          }
          tgtNode.setAttribute("checked", "checked");
        }
        break;
    }
  }, false);
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
})();