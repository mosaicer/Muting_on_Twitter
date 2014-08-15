// ==UserScript==
// @name        Muting on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Mutes texts/links/tags/userIDs on Twitter and changes tweets' style
// @version     4.2
// @include     https://twitter.com/
// @include     https://twitter.com/search?*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// ==/UserScript==
(function () {
  var Init = function() {
        this.menu_jp = {
          mute_text_flag: ["ツイート本文についてのミュートを", {}],
          mute_link_flag: ["リンクについてのミュートを", {}],
          mute_tag_flag: ["ハッシュタグについてのミュートを", {}],
          mute_userId_flag: ["ユーザーIDについてのミュートを", {}],
          style_flag: ["各ツイートの装飾を", {}]
        };
        this.menu_en = {
          mute_text_flag: [" mute for texts in tweet", {}],
          mute_link_flag: [" mute for links in tweet", {}],
          mute_tag_flag: [" mute for hashtags in tweet", {}],
          mute_userId_flag: [" mute for userIDs in tweet", {}],
          style_flag: [" changing tweet style", {}]
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
                "' はすでに設定されています",
                "' は設定した文字列とマッチしませんでした",
                "↓ミュートする文字列をカンマ区切りで表示しています↓\n\n",
                "ミュートする文字列が設定されていません",
                "申し訳ないですが、ミュートする文字列に,/は使うことができません"
              ],
          en: [
                "' is already set for mute word",
                "' is not set for mute word",
                "↓The mute words separated by conmma↓\n\n",
                "The mute words are not found",
                "Sorry, the mute words which contains the word ',/' can not be set"
              ]
        };
      },
      buttonAction,
      MuteFeatures = function() {
        this.homeTweets = "";
        this.replyPrnt = ""; // parent nodes of tweets of reply
        this.flag = "";
        this.i = 0;
        this.j = 0;
        // use when judging elements
        this.tweetPrnt = "";
        this.tweetElement = "";
      },
      muteAction,
      key = "",
      pageURL = location.href,
      userLang = window.navigator.language === "ja" ? "ja" : "en",
      splitWord = ",/",
      // MutationObserver
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      observer,
      // decorate all tweets, not constructer
      tweetStyleChange = function() {
        // make font-weight of tweets' letters bold
        if (pageURL === "https://twitter.com/") {
          Array.prototype.slice.call(document.querySelectorAll("[class='js-tweet-text tweet-text']")).forEach(
            function (targetNode) {
              targetNode.style.fontWeight = "bold";
            }
          );
        }
        // make color of tweets' usernames and userIDs red
        Array.prototype.slice.call(document.querySelectorAll("[class*='js-action-profile-name']")).forEach(
          function (targetNode) {
            targetNode.style.color = "red";
          }
        );
        // make color of tweets' time blue
        Array.prototype.slice.call(document.querySelectorAll("[data-long-form='true']")).forEach(
          function (targetNode) {
            targetNode.style.color = "blue";
          }
        );
        Array.prototype.slice.call(document.querySelectorAll("[class='twitter-timeline-link']")).forEach(
          function (targetNode) {
            targetNode.setAttribute("target", "_blank");
          }
        );
      };

  Init.prototype = {
    accessSet: function() {
      if (userLang === "ja") {
        for (key in this.menu_jp) {
          if (this.menu_jp.hasOwnProperty(key)) {
            // set each flags, once after installing this user script
            if (typeof GM_getValue(key) === "undefined") {
              GM_setValue(key, true);
            }
            // construct command menus
            this.msgFlag = GM_getValue(key) === true ? "無効" : "有効";
            this.msg = this.menu_jp[key][0] + this.msgFlag + "にする";
            GM_registerMenuCommand(this.msg, this.featuresChg.bind(this.menu_jp[key][1][key + "Change"], key));
          }
        }
      } else {
        for (key in this.menu_en) {
          if (this.menu_jp.hasOwnProperty(key)) {
            // set each flags, once after installing this user script
            if (typeof GM_getValue(key) === "undefined") {
              GM_setValue(key, true);
            }
            // construct command menus
            this.msgFlag = GM_getValue(key) === true ? "Disable" : "Enable";
            this.msg = this.msgFlag + this.menu_en[key][0];
            GM_registerMenuCommand(this.msg, this.featuresChg.bind(this.menu_en[key][1][key + "Change"], key));
          }
        }
      }
      for (key in this.muteNameArray) {
        if (this.muteNameArray.hasOwnProperty(key) && typeof GM_getValue(key) !== "undefined") {
          if (GM_getValue(key).indexOf(splitWord) >= 0) {
            this.muteNameArray[key] = GM_getValue(key).split(splitWord);
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
    // the function of command menus, make available or unavailable
    featuresChg: function(flagName) {
      this.msgFlag = GM_getValue(flagName) === true ? false : true;
      GM_setValue(flagName, this.msgFlag);
      location.href = pageURL;
    }
  };

  HeaderStruct.prototype.styleSet = function () {
    // change a header's style
    if (pageURL === "https://twitter.com/") {
      this.contentHeader.style.borderStyle = "hidden";
      this.headerInner.style.height = "65px";
      this.headerInner.style.backgroundColor = "transparent";
    }
    // set a button that shows/hides input form
    this.openClose_btn.setAttribute("id", "open_close");
    this.openClose_btn.style.backgroundColor = "#FFD700";
    this.openClose_btn.style.cursor = "pointer";
    this.openClose_btn.style.width = "290px";
    this.openClose_btn.style.textAlign = "center";
    this.openClose_btn.style.marginBottom = "15px";
    this.openClose_btn.appendChild(document.createTextNode(this.openClose_msg[userLang]));
    this.parentFormNode.insertBefore(this.openClose_btn, this.previousNode);
    // construct a container of input form
    this.formContainer = "<form onsubmit='return false;'>" +
          "<input type='text' id='mLtrForm' class='form_btn' value='' placeholder='" +
          this.placeholderAry[userLang][0] + "' style='width: " + this.headerWidth + "px;'>" +
          "<input type='button' id='mLtrAdd' class='form_btn' value='" + this.btnAry[userLang][0] + "'>" +
          "<input type='button' id='mLtrRmv' class='form_btn' value='" + this.btnAry[userLang][1] + "'>" +
          "<input type='button' id='mLtrConf' value='" + this.btnAry[userLang][2] + "' style='color:black;'>" +
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
        targetNode.style.marginRight = "10px";
        targetNode.style.color = "black";
      }
    );
    // check the flag of input form
    if (GM_getValue("form_flag") === false) {
      if (pageURL === "https://twitter.com/") {
        this.contentHeader.style.display = "none";
      } else {
        this.formNode.style.display = "none";
      }
    }
  };

  ButtonSet.prototype = {
    // add letters to a mute list
    addMuteLtr: function (btn_flag, theLetter) {
      this.btnFlag = btn_flag;
      this.pluralFlag = 0;
      if (theLetter !== "") {
        if (theLetter.indexOf(splitWord + splitWord) < 0 && theLetter !== splitWord) {
          if (theLetter.indexOf(splitWord) >= 0) {
            this.pluralFlag = 1;
            this.muteListTemp = [];
            theLetter.split(splitWord).forEach(this.addFunc, buttonAction);
          } else {
            this.muteListTemp = "";
            this.addFunc(theLetter);
          }
          if (this.muteListTemp[0] !== "" && this.pluralFlag === 1 || this.muteListTemp !== "" && this.pluralFlag === 0) {
            if (this.pluralFlag === 0) {
              GM_setValue(btn_flag, this.muteListTemp);
            } else {
              if (typeof GM_getValue(btn_flag) === "undefined" || setting.muteNameArray[btn_flag][0] === "") {
                GM_setValue(btn_flag, this.muteListTemp.join(splitWord));
              } else {
                GM_setValue(btn_flag, setting.muteNameArray[btn_flag].join(splitWord) + splitWord + this.muteListTemp.join(splitWord));
              }
            }
            location.href = pageURL;
          }
        } else {
          alert(this.altMsgAry[userLang][4]);
        }
      }
    },
    addFunc: function (targetLtr) {
      this.targetText = targetLtr;
      this.muteFlag = 0;
      if (this.targetText !== "") {
        if (typeof GM_getValue(this.btnFlag) === "undefined" || setting.muteNameArray[this.btnFlag][0] === "") {
          if (this.pluralFlag === 1) {
            this.muteListTemp.push(this.targetText);
          } else {
            this.muteListTemp = this.targetText;
          }
        }
        else {
          setting.muteNameArray[this.btnFlag].forEach(this.completeComp, buttonAction);
          if (this.muteFlag === 0) {
            if (this.pluralFlag === 1) {
              this.muteListTemp.push(this.targetText);
            } else {
              this.muteListTemp = setting.muteNameArray[this.btnFlag].join(splitWord) + splitWord + this.targetText;
            }
          } else {
            alert("'" + this.targetText + this.altMsgAry[userLang][0]);
          }
        }
      }
    },
    // delete letters from a mute list
    delMuteLtr: function (btn_flag, theLetter) {
      this.btnFlag = btn_flag;
      this.muteListTemp = setting.muteNameArray[btn_flag];
      if (theLetter !== "") {
        if (theLetter.indexOf(splitWord + splitWord) < 0 && theLetter !== splitWord) {
          if (theLetter.indexOf(splitWord) >= 0) {
            theLetter.split(splitWord).forEach(this.deleteFunc, buttonAction);
          } else {
            this.deleteFunc(theLetter);
          }
          if (this.muteListTemp !== setting.muteNameArray[btn_flag]) {
            GM_setValue(this.btnFlag, this.muteListTemp.join(splitWord));
            location.href = pageURL;
          }
        } else {
          alert(this.altMsgAry[userLang][4]);
        }
      }
    },
    deleteFunc: function (targetLtr) {
      this.targetText = targetLtr;
      this.muteFlag = 0;
      if (this.targetText !== "") {
        if (typeof GM_getValue(this.btnFlag) === "undefined" || this.muteListTemp[0] === "") {
          alert(this.altMsgAry[userLang][3]);
        }
        else {
          this.muteListTemp.forEach(this.completeComp, buttonAction);
          if (this.muteFlag === 1) {
            this.muteListTemp = this.muteListTemp.filter(this.filterFunc, buttonAction);
          } else {
            alert("'" + this.targetText + this.altMsgAry[userLang][1]);
          }
        }
      }
    },
    // confirm a mute list
    confMuteLtr: function (btn_flag) {
      if (typeof GM_getValue(btn_flag) !== "undefined" && setting.muteNameArray[btn_flag][0] !== "") {
        alert(this.altMsgAry[userLang][2] + setting.muteNameArray[btn_flag]);
      }
      else {
        alert(this.altMsgAry[userLang][3]);
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
    muteTweet: function (addedTweets) {
      // remove promoted tweet
      if (document.querySelector("[data-promoted='true']") !== null) {
        document.querySelector("[data-promoted='true']").parentNode.style.display = "none";
      }
      // remove a banner of header
      if (document.querySelector("[class='promptbird promptbird-below-black-bar']") !== null) {
        document.querySelector("[class='promptbird promptbird-below-black-bar']").style.display = "none";
      }

      // when nodes are added
      if (typeof addedTweets !== "undefined") {
        this.homeTweets = Array.prototype.slice.call(addedTweets);
      }
      // when nodes are not added
      else {
        this.homeTweets = Array.prototype.slice.call(document.querySelectorAll("[data-item-type]"));
      }
      this.homeTweets.forEach(this.nodeCheck, muteAction);
    },
    nodeCheck: function (targetNode) {
      var tweetPtag;
      if (targetNode.hasAttribute("data-item-type")) {
        this.tweetPrnt = targetNode;
        if (typeof this.tweetPrnt.childNodes[1].childNodes[3] !== "undefined") {
          tweetPtag = this.tweetPrnt.childNodes[1].childNodes[3].childNodes[3];
        }
        // reply
        if (typeof tweetPtag === "undefined") {
          if (pageURL === "https://twitter.com/") {
            for (this.i = 3; typeof this.tweetPrnt.childNodes[1].childNodes[this.i] !== "undefined"; this.i++) {
              this.replyPrnt = this.tweetPrnt.childNodes[1].childNodes[this.i];
              if (
                typeof this.replyPrnt.childNodes[1] !== "undefined" &&
                this.replyPrnt.childNodes[1].getAttribute("data-you-block")
              ) {
                this.tweetPrnt = this.replyPrnt;
                tweetPtag = this.replyPrnt.childNodes[1].childNodes[3].childNodes[3];
                this.tweetElmCheck(tweetPtag);
                this.tweetPrnt = targetNode;
              }
            }
          }
          else {
            if (
              this.tweetPrnt.childNodes[1].className !== "account-group js-account-group js-user-profile-link" &&
              this.tweetPrnt.childNodes[1].className !== "avatar size32 js-user-profile-link"
            ) {
              tweetPtag = this.tweetPrnt.childNodes[1].childNodes[1].childNodes[1].childNodes[3].childNodes[3];
              this.tweetElmCheck(tweetPtag);
            }
          }
        }
        // not reply
        else {
          // on Search page, timeline
          if (tweetPtag.className === "fullname js-action-profile-name show-popup-with-id") {
            tweetPtag = this.tweetPrnt.childNodes[1].childNodes[5];
          }
          this.tweetElmCheck(tweetPtag);
        }
      }
    },
    tweetElmCheck: function(twtPtag) {
      for (this.j = 0; typeof twtPtag.childNodes[this.j] !== "undefined"; this.j++) {
        this.tweetElement = twtPtag.childNodes[this.j];
        // <A> tag
        if (this.tweetElement.nodeName === "A") {
          // "pic.twitter.com"
          if (this.tweetElement.hasAttribute("data-pre-embedded")) {
            this.tweetElement.setAttribute("href", "http://" + this.tweetElement.childNodes[0].nodeValue);
            this.muteLtrCheck("mute_links");
          }
          // not "pic.twitter.com"
          else if (this.tweetElement.hasAttribute("title")) {
            this.tweetElement.setAttribute("href", this.tweetElement.getAttribute("title"));
            this.muteLtrCheck("mute_links");
          }
          // hashtags
          else if (this.tweetElement.hasAttribute("data-query-source")) {
            this.muteLtrCheck("mute_tags");
          }
          // userIDs
          else if (this.tweetElement.childNodes[0].childNodes[0].nodeValue === "@") {
            this.muteLtrCheck("mute_ids");
          }
        }
        // text or <STRONG> tag
        else if (this.tweetElement.nodeName === "#text" || this.tweetElement.nodeName === "STRONG") {
          this.muteLtrCheck("mute_words");
        }
      }
    },
    muteLtrCheck: function (mute_flag) {
      if (typeof GM_getValue(mute_flag) !== "undefined" && setting.muteNameArray[mute_flag][0] !== "") {
        this.flag = mute_flag;
        setting.muteNameArray[mute_flag].forEach(this.muteFunc, muteAction);
      }
    },
    muteFunc: function (targetLtr) {
      var nodeValTemp = "";
      switch (this.flag) {
        case "mute_words":
          if (GM_getValue("mute_text_flag") === true) {
            // text
            if (this.tweetElement.nodeName === "#text") {
              if (this.tweetElement.nodeValue.indexOf(targetLtr) >= 0) {
                this.tweetPrnt.style.display = "none";
              }
            }
            // <STRONG> tag
            else {
              // add the previous text if it exists
              if (this.tweetElement.previousSibling !== null && this.tweetElement.previousSibling.nodeName === "#text") {
                nodeValTemp = this.tweetElement.previousSibling.nodeValue;
              }
              // text of <STRONG> tag
              nodeValTemp += this.tweetElement.childNodes[0].nodeValue;
              // add the next text if it exists
              if (this.tweetElement.nextSibling !== null && this.tweetElement.nextSibling.nodeName === "#text") {
                nodeValTemp += this.tweetElement.nextSibling.nodeValue;
              }
              // alert(nodeValTemp);
              if (nodeValTemp.indexOf(targetLtr) >= 0) {
                this.tweetPrnt.style.display = "none";
              }
            }
          }
          break;
        case "mute_links":
          if (GM_getValue("mute_link_flag") === true) {
            // not "pic.twitter.com"
            if (this.tweetElement.hasAttribute("title")) {
              if (this.tweetElement.getAttribute("title").indexOf(targetLtr) >= 0) {
                this.tweetPrnt.style.display = "none";
              }
            }
            // "pic.twitter.com"
            else if (this.tweetElement.textContent.indexOf(targetLtr) >= 0) {
              this.tweetPrnt.style.display = "none";
            }
          }
          break;
        case "mute_tags":
          if (
            GM_getValue("mute_tag_flag") === true &&
            this.tweetElement.childNodes[1].textContent.indexOf(targetLtr) >= 0
          ) {
            this.tweetPrnt.style.display = "none";
          }
          break;
        case "mute_ids":
          if (
            GM_getValue("mute_userId_flag") === true &&
            this.tweetElement.childNodes[1].textContent.indexOf(targetLtr) >= 0
          ) {
            this.tweetPrnt.style.display = "none";
          }
          break;
      }
    }
  };

  setting = new Init();
  header = new HeaderStruct();
  buttonAction = new ButtonSet();
  muteAction = new MuteFeatures();

  setting.accessSet();
  header.styleSet();
  muteAction.muteTweet();

  if (GM_getValue("style_flag") === true) {
    tweetStyleChange();
  }

  // events of all buttons------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    var tgtNode = e.target; // nodes clicked
    switch (tgtNode.id) {
      // input form
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
      case "mLtrAdd":
        buttonAction.addMuteLtr(document.querySelector("[checked]").value, document.getElementById("mLtrForm").value);
        break;
      case "mLtrRmv":
        buttonAction.delMuteLtr(document.querySelector("[checked]").value, document.getElementById("mLtrForm").value);
        break;
      case "mLtrConf":
        buttonAction.confMuteLtr(document.querySelector("[checked]").value);
        break;
      default:
        // radio buttons
        if (tgtNode.name === "muteLetter") {
          // check must be unique
          if (document.querySelector("[checked]")) {
            document.querySelector("[checked]").removeAttribute("checked");
          }
          tgtNode.setAttribute("checked", "checked");
        }
        break;
    }
  }, false);
  // MutationObserver-----------------------------------------------------------------------
  observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (GM_getValue("style_flag") === true) {
        tweetStyleChange();
      }
      if (mutation.addedNodes.length !== 0) {
        muteAction.muteTweet(mutation.addedNodes);
      }
    });
  });
  observer.observe(document.getElementById("stream-items-id"), {childList: true } );
})();