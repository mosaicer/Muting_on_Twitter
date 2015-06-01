// ==UserScript==
// @name        Muting on Twitter
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description Mutes texts/links/tags/userIDs on Twitter and changes tweets' style
// @version     6.1
// @include     https://twitter.com/
// @include     https://twitter.com/search?*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_addStyle
// ==/UserScript==
(function () {
  'use strict';

  var SPLIT_WORD = ',/',
      urlCheckFlag = (location.href === 'https://twitter.com/'),
      userLang = window.navigator.language === 'ja' ? 'ja' : 'en',
      // each class names
      FORM_CLASS = 'form-btn',
      TL_CLASS = 'expand-tl',
      VISIVILITY_CLASS = 'mot-visivility',
      RADIO_BTN_CLASS = 'radio-btn-color',
      // setting
      key = '',
      muteWordsArray = {
        mute_words: [],
        mute_links: [],
        mute_tags: [],
        mute_ids: []
      },
      flagList = {
        style_flag: true,
        mute_text_flag: true,
        mute_link_flag: true,
        mute_tag_flag: true,
        mute_userId_flag: true,
        form_flag: true,
        time: 200
      },
      formFlagList = {
        mute_text_flag: ['form_text'],
        mute_link_flag: ['form_link'],
        mute_tag_flag: ['form_tag'],
        mute_userId_flag: ['form_userId']
      },
      initSetting = function () {
        var commandMenu = {
              ja: {
                autoRefresh_flag: ['自動更新を有効/無効にする', {}],
                style_flag: ['各ツイートの装飾を有効/無効にする', {}],
                mute_text_flag: ['ツイート本文についてのミュートを有効/無効にする', {}],
                mute_link_flag: ['リンクについてのミュートを有効/無効にする', {}],
                mute_tag_flag: ['ハッシュタグについてのミュートを有効/無効にする', {}],
                mute_userId_flag: ['ユーザーIDについてのミュートを有効/無効にする', {}]
              },
              en: {
                autoRefresh_flag: ['Disable/Enable auto refresh', {}],
                style_flag: ['Disable/Enable changing tweet style', {}],
                mute_text_flag: ['Disable/Enable muting texts in tweet', {}],
                mute_link_flag: ['Disable/Enable muting links in tweet', {}],
                mute_tag_flag: ['Disable/Enable muting hashtags in tweet', {}],
                mute_userId_flag: ['Disable/Enable muting userIDs in tweet', {}]
              }
            },
            commandMenuTemp = commandMenu[userLang],
            /**
              the function of command menus, make available or unavailable
              @param: a key of table in a DB file
            */
            changeFeatures = function (flagName) {
              var tempFlag = !GM_getValue(flagName);

              GM_setValue(flagName, tempFlag);

              if (flagName === 'autoRefresh_flag') {
                if (tempFlag) {
                  autoRefreshObserver.observe(notifyNewTweetBtn, config);
                } else {
                  autoRefreshObserver.disconnect();
                }
              } else {
                flagList[flagName] = tempFlag;
                if (flagName !== 'style_flag') {
                  formFlagList[flagName][1].classList.toggle(RADIO_BTN_CLASS);
                }
              }
            },
            setTimeMsg = {
              ja: '時間の設定',
              en: 'Set time'
            },
            setTimeFunc = function() {
              var inputTime = prompt('', flagList['time']);

              if (!!inputTime && /\d+/g.test(inputTime)) {
                GM_setValue('time', inputTime);
                flagList['time'] = inputTime;
              }
            };

        for (key in commandMenuTemp) {
          if (commandMenuTemp.hasOwnProperty(key)) {
            // set each flags, once after installing this user script
            if (typeof GM_getValue(key) === 'undefined') {
              GM_setValue(key, true);
            }

            GM_registerMenuCommand(
              commandMenuTemp[key][0],
              changeFeatures.bind(commandMenuTemp[key][1][key], key)
            );
          }
        }

        for (key in muteWordsArray) {
          if (muteWordsArray.hasOwnProperty(key) && !!GM_getValue(key)) {
            if (GM_getValue(key).indexOf(SPLIT_WORD) >= 0) {
              muteWordsArray[key] = GM_getValue(key).split(SPLIT_WORD);
            } else {
              muteWordsArray[key].push(GM_getValue(key));
            }
          }
        }

        if (typeof GM_getValue('form_flag') === 'undefined') {
          GM_setValue('form_flag', true);
        }
        if (typeof GM_getValue('time') === 'undefined') {
          GM_setValue('time', '200');
        }

        for (key in flagList) {
          if (flagList.hasOwnProperty(key)) {
            flagList[key] = GM_getValue(key);
          }
        }

        GM_registerMenuCommand(setTimeMsg[userLang], setTimeFunc);
      },
      // Construct the header
      muteForm = document.createElement('div'),
      timeline = !!document.getElementById('timeline') ? document.getElementById('timeline') : document.querySelector('.GridTimeline'),
      pageContainer = document.getElementById('page-container'),
      muteInputForm,
      // on home page, this is tweet form
      timelineHeader = document.querySelector('.timeline-tweet-box'),
      setHeaderAndBtn = function () {
        var btnToOpenCloseMuteForm = document.createElement('div'),
            openCloseBtnText = {
              ja: ['ミュートフォーム欄の開閉', 'ツイート欄の開閉'],
              en: ['Open/Close mute input form', 'Open/Close tweet form']
            },
            openCloseBtnTextTemp = openCloseBtnText[userLang],
            placeholderArray = {
              ja: [
                ',/(カンマ&スラッシュ)で文字列を区切ることで複数保存可能です',
                'テキスト',
                'リンク',
                'ハッシュタグ',
                'ユーザーID',
                'ミュートするタイプを選んでください'
              ],
              en: [
                'You can input plural words by dividing them by ,/(conmma & slash)',
                'texts',
                'links',
                'hashtags',
                'userIDs',
                'Please choose a type of muting'
              ]
            },
            placeholderArrayTemp = placeholderArray[userLang],
            btnTextArray = {
              ja: ['追加', '削除', '確認'],
              en: ['Add', 'Del', 'Conf']
            },
            btnTextArrayTemp = btnTextArray[userLang],
            tweetFormTextArray = {
              ja: '左のアイコンをクリックすることでタイムラインを拡大/縮小できます',
              en: 'By clicking the left icon, the timeline is expanded/contracted'
            },
            muteFormWidth = 440,
            leftDashBorad = urlCheckFlag ? pageContainer.childNodes[1] :
              document.querySelector('.SidebarCommonModules'),
            btnToOpenCloseTweet,
            // DashBoardProfileCard or module
            leftDashBoradTop = leftDashBorad.childNodes[1];

        btnToOpenCloseMuteForm.setAttribute('id', 'open_close');
        btnToOpenCloseMuteForm.setAttribute('class', 'btn primary-btn tweet-btn');
        btnToOpenCloseMuteForm.style.marginBottom = '10px';
        btnToOpenCloseMuteForm.appendChild(
          document.createTextNode(openCloseBtnTextTemp[0])
        );

        leftDashBorad.insertBefore(btnToOpenCloseMuteForm, leftDashBoradTop);

        if (urlCheckFlag) {
          muteFormWidth = 418;

          btnToOpenCloseTweet = document.createElement('div');
          btnToOpenCloseTweet.setAttribute('id', 'open_close_tweet');
          btnToOpenCloseTweet.setAttribute('class', 'btn primary-btn tweet-btn');
          btnToOpenCloseTweet.style.marginBottom = '10px';
          btnToOpenCloseTweet.appendChild(
            document.createTextNode(openCloseBtnTextTemp[1])
          );

          leftDashBorad.insertBefore(btnToOpenCloseTweet, leftDashBoradTop);

          document.querySelector('[data-condensed-text]')
            .setAttribute('data-condensed-text', tweetFormTextArray[userLang]);
        }

        muteForm.innerHTML = '<form onsubmit="return false;">' +
              '<input type="text" id="mLtrForm" class="' + FORM_CLASS +
              '" value="" placeholder="' + placeholderArrayTemp[0] +
              '" style="width: ' + muteFormWidth + 'px;">' +
              '<input type="button" id="mLtrAdd" class="' + FORM_CLASS +
              '" value="' + btnTextArrayTemp[0] + '">' +
              '<input type="button" id="mLtrRmv" class="' + FORM_CLASS +
              '" value="' + btnTextArrayTemp[1] + '">' +
              '<input type="button" id="mLtrConf" value="' +
              btnTextArrayTemp[2] + '">' +
              '</form><div style="background-color:white; margin-top:8px;' +
              ' font-size:12px; color:black; height:23px;">' +
              '<span style="color:green; margin-left:5px;">' +
              placeholderArrayTemp[5] + '：　</span>' +
              '<label id="form_text" style="margin-right: 17px;"><input ' +
              'type="radio" name="muteLetter" value="mute_words" checked>' +
              placeholderArrayTemp[1] + '</label>' +
              '<label id="form_link" style="margin-right: 17px;"><input ' +
              'type="radio" name="muteLetter" value="mute_links">' +
              placeholderArrayTemp[2] + '</label>' +
              '<label id="form_tag" style="margin-right: 17px;"><input ' +
              'type="radio" name="muteLetter" value="mute_tags">' +
              placeholderArrayTemp[3] + '</label>' +
              '<label id="form_userId" style="margin-right: 17px;"><input ' +
              'type="radio" name="muteLetter" value="mute_ids">' +
              placeholderArrayTemp[4] + '</label></div>';

        muteForm.style.marginBottom = '10px';
        timeline.insertBefore(muteForm, timeline.childNodes[1]);

        if (!flagList.form_flag) {
          muteForm.classList.add(VISIVILITY_CLASS);
        }
      },
      // actions of muting button
      alertMsgArray = {
        ja: [
          '" はすでに設定されています',
          '" は設定した文字列とマッチしませんでした',
          'ミュートする文字列が設定されていません',
          '申し訳ないですが、ミュートする文字列に",/"は使うことができません'
        ],
        en: [
          '" is already set for mute word',
          '" is not set for mute word',
          'The mute words are not found',
          'Sorry, the mute words which contains the word ",/" can not be set'
        ]
      },
      alertMsgArrayTmep = alertMsgArray[userLang],
      pluralFlag,
      muteListTemp,
      btnFlag,
      addedMuteWord = [],
      addedFlag = false,
      deletedFlag = false,
      /**
        add letters to a mute list
        @param: an input letter for muting
      */
      addMuteLetter = function (theLetter) {
        var gmValueTemp;

        pluralFlag = false;

        if (!!theLetter) {
          if (
            theLetter.indexOf(SPLIT_WORD + SPLIT_WORD) < 0 &&
            theLetter !== SPLIT_WORD
          ) {
            if (theLetter.indexOf(SPLIT_WORD) >= 0) {
              pluralFlag = true;
              muteListTemp = [];
              theLetter.split(SPLIT_WORD).forEach(addFunc);
            } else {
              muteListTemp = '';
              addFunc(theLetter);
            }

            if (
              (!!muteListTemp[0] && pluralFlag) ||
              (!!muteListTemp && !pluralFlag)
            ) {
              if (pluralFlag) {
                if (!!GM_getValue(btnFlag) && !!muteWordsArray[btnFlag][0]) {
                  GM_setValue(btnFlag,
                    muteWordsArray[btnFlag].join(SPLIT_WORD) +
                    SPLIT_WORD +
                    muteListTemp.join(SPLIT_WORD)
                  );
                } else {
                  GM_setValue(btnFlag, muteListTemp.join(SPLIT_WORD));
                }

                addedMuteWord = muteListTemp;
              } else {
                GM_setValue(btnFlag, muteListTemp);
              }

              gmValueTemp = GM_getValue(btnFlag);

              if (gmValueTemp.indexOf(SPLIT_WORD) >= 0) {
                muteWordsArray[btnFlag] = gmValueTemp.split(SPLIT_WORD);
              } else {
                muteWordsArray[btnFlag].push(gmValueTemp);
              }

              addedFlag = true;
              muteTweet();

              addedFlag = false;
              muteInputForm.value = '';
              addedMuteWord = [];
            }
          } else {
            alert(alertMsgArrayTmep[3]);
          }
        }
      },
      addFunc = function (targetLtr) {
        if (!!targetLtr) {
          if (!!GM_getValue(btnFlag) && !!muteWordsArray[btnFlag][0]) {
            if (muteWordsArray[btnFlag].indexOf(targetLtr) < 0) {
              if (pluralFlag) {
                muteListTemp.push(targetLtr);
              } else {
                muteListTemp =
                  muteWordsArray[btnFlag].join(SPLIT_WORD) +
                  SPLIT_WORD +
                  targetLtr;

                addedMuteWord.push(targetLtr);
              }
            } else {
              alert('"' + targetLtr + alertMsgArrayTmep[0]);
            }
          } else {
            if (pluralFlag) {
              if (muteListTemp.indexOf(targetLtr) < 0) {
                muteListTemp.push(targetLtr);
              } else {
                alert('"' + targetLtr + alertMsgArrayTmep[0]);
              }
            } else {
              muteListTemp = targetLtr;

              addedMuteWord.push(targetLtr);
            }
          }
        }
      },
      /**
        delete letters from a mute list
        @param: an input letter for deleting
      */
      delMuteLetter = function (theLetter) {
        muteListTemp = muteWordsArray[btnFlag];

        if (!!theLetter) {
          if (
            theLetter.indexOf(SPLIT_WORD + SPLIT_WORD) < 0 &&
            theLetter !== SPLIT_WORD
          ) {
            if (theLetter.indexOf(SPLIT_WORD) >= 0) {
              theLetter.split(SPLIT_WORD).forEach(delFunc);
            } else {
              delFunc(theLetter);
            }

            if (muteListTemp !== muteWordsArray[btnFlag]) {
              GM_setValue(btnFlag, muteListTemp.join(SPLIT_WORD));
              muteWordsArray[btnFlag] = muteListTemp;

              deletedFlag = true;
              muteTweet();

              deletedFlag = false;
              muteInputForm.value = '';
            }
          } else {
            alert(alertMsgArrayTmep[3]);
          }
        }
      },
      delFunc = function (targetLtr) {
        if (!!targetLtr) {
          if (!!GM_getValue(btnFlag) && !!muteListTemp[0]) {
            if (muteListTemp.indexOf(targetLtr) >= 0) {
              muteListTemp = muteListTemp.filter(function (targetText) {
                return (targetText !== targetLtr);
              });
            } else {
              alert('"' + targetLtr + alertMsgArrayTmep[1]);
            }
          } else {
            alert(alertMsgArrayTmep[2]);
          }
        }
      },
      // confirm a mute list
      confMuteLetter = function () {
        if (!!GM_getValue(btnFlag) && !!muteWordsArray[btnFlag][0]) {
          alert(muteWordsArray[btnFlag].join('\n'));
        } else {
          alert(alertMsgArrayTmep[2]);
        }
      },
      // muting
      tweetParent,
      changeTweetHeaderStyle = function (twiHeader) {
        twiHeader.childNodes[3].childNodes[1].style.color = 'blue';
        twiHeader = twiHeader.childNodes[1];
        twiHeader.childNodes[3].style.color = 'red';
        twiHeader.childNodes[6].style.color = 'red';
      },
      muteTweet = function (addedTweets) {
        var styleFlag = flagList.style_flag,
            homeTweets;

        // remove promoted tweet
        if (!!document.querySelector('[data-promoted="true"]')) {
          [].forEach.call(document.querySelectorAll('[data-promoted="true"]'),
            function (targetNode) {
              targetNode.parentNode.style.display = 'none';
            }
          );
        }
        // remove a banner of header
        if (!!document.querySelector('[class="promptbird promptbird-below-black-bar"]')) {
          document.querySelector('[class="promptbird promptbird-below-black-bar"]').style.display = 'none';
        }

        // when nodes are added
        if (!!addedTweets) {
          homeTweets = [].slice.call(addedTweets);
        }
        // when nodes are not added
        else {
          homeTweets = [].slice.call(
            document.querySelectorAll('[data-item-type]')
          );
        }

        // check each tweets
        homeTweets.forEach(function (targetNode) {
          var pTagFlag = false,
              muteSuccessFlagSub = false,
              tweetPtag,
              i,
              tweetHeader;

          if (targetNode.hasAttribute('data-item-type')) {
            if (
              (!deletedFlag && !targetNode.classList.contains(VISIVILITY_CLASS)) ||
              (deletedFlag && targetNode.classList.contains(VISIVILITY_CLASS))
            ) {
              tweetParent = targetNode;

              pTagFlag = (tweetParent.childNodes[0].nodeName === 'DIV');

              if (!!tweetParent.childNodes[1].childNodes[3] || pTagFlag) {
                if (!!tweetParent.childNodes[1].childNodes[3].childNodes[3] || pTagFlag) {
                  if (pTagFlag) {
                    // this is a very rare case...
                    tweetPtag = tweetParent.childNodes[0].childNodes[3].childNodes[3];
                    pTagFlag = false;
                  } else {
                    tweetPtag = tweetParent.childNodes[1].childNodes[3].childNodes[3];
                  }

                  // on Search page, timeline
                  if (tweetPtag.className === 'fullname js-action-profile-name show-popup-with-id') {
                    pTagFlag = true;
                    tweetPtag = tweetParent.childNodes[1].childNodes[5];
                  }

                  muteSuccessFlagSub = checkTweetElement(tweetPtag);

                  // change tweet style
                  if (muteSuccessFlagSub && styleFlag) {
                    // on Search page, timeline
                    if (pTagFlag) {
                      tweetHeader = tweetParent.childNodes[1].childNodes[3];
                      tweetHeader.childNodes[3].style.color = 'red';
                      tweetHeader.childNodes[6].style.color = 'red';
                    } else {
                      tweetHeader = tweetParent.childNodes[1].childNodes[3].childNodes[1];

                      if (!!tweetHeader.childNodes[3]) {
                        changeTweetHeaderStyle(tweetHeader);
                      }
                      // on Search page, user name
                      else {
                        tweetHeader = tweetPtag.nextSibling.nextSibling;
                        tweetHeader.childNodes[1].style.color = 'red';
                        tweetHeader.childNodes[3].childNodes[1].style.color = 'red';
                      }
                    }
                  }
                }
                // Reply
                else {
                  for (i = 3; !!tweetParent.childNodes[1].childNodes[i]; i++) {
                    tweetParent = tweetParent.childNodes[1].childNodes[i];
                    if (
                      tweetParent.nodeName === 'LI' &&
                      tweetParent.className !== 'missing-tweets-bar'
                    ) {
                      tweetPtag = tweetParent.childNodes[1].childNodes[3].childNodes[3];

                      muteSuccessFlagSub = checkTweetElement(tweetPtag);

                      if (muteSuccessFlagSub && styleFlag) {
                        tweetHeader = tweetParent.childNodes[1].childNodes[3].childNodes[1];

                        changeTweetHeaderStyle(tweetHeader);
                      }
                    }
                    tweetParent = targetNode;
                  }
                }
              }
              // expanded tweets on Search page
              else if (tweetParent.childNodes[1].className === 'expanded-conversation expansion-container js-expansion-container js-navigable-stream') {
                tweetHeader = tweetParent
                              .childNodes[1]
                              .childNodes[1]
                              .childNodes[1]
                              .childNodes[3];
                tweetPtag = tweetHeader.childNodes[3];

                muteSuccessFlagSub = checkTweetElement(tweetPtag);

                if (muteSuccessFlagSub && styleFlag) {
                  tweetHeader = tweetHeader.childNodes[1];

                  changeTweetHeaderStyle(tweetHeader);
                }
              }
            }
          }

          if (muteSuccessFlagSub && deletedFlag) {
            tweetParent.classList.remove(VISIVILITY_CLASS);
          }
        });
      },
      /**
        @param:  <P> tag that contains contexts of tweet
        @return: true or false
      */
      checkTweetElement = function(twiPtag) {
        var muteSuccessFlag = true,
            styleFlag = flagList.style_flag,
            j,
            tweetElement;

        for (j = 0; !!twiPtag.childNodes[j] && muteSuccessFlag; j++) {
          tweetElement = twiPtag.childNodes[j];

          // <A> tag
          if (tweetElement.nodeName === 'A') {
            // "pic.twitter.com"
            if (tweetElement.hasAttribute('data-pre-embedded')) {
              muteSuccessFlag = !(checkMuteLetter('mute_links', tweetElement));
            }
            // not "pic.twitter.com"
            else if (tweetElement.hasAttribute('title')) {
              muteSuccessFlag = !(checkMuteLetter('mute_links', tweetElement));

              if (muteSuccessFlag) {
                tweetElement.setAttribute('href', tweetElement.getAttribute('title'));
                tweetElement.setAttribute('target', '_blank');
              }
            }
            // hashtags
            else if (tweetElement.hasAttribute('data-query-source')) {
              muteSuccessFlag = !(checkMuteLetter('mute_tags', tweetElement));
            }
            // userIDs
            else if (tweetElement.className === 'twitter-atreply pretty-link') {
              muteSuccessFlag = !(checkMuteLetter('mute_ids', tweetElement));
            }
          }
          // text or <STRONG> tag
          else {
            if (tweetElement.nodeName === '#text') {
              muteSuccessFlag = !(checkMuteLetter('mute_words', tweetElement));

              // change the tweet's texts of font-weight
              if (muteSuccessFlag && styleFlag && urlCheckFlag) {
                tweetElement.parentNode.style.fontWeight = 'bold';
              }
            } else if (tweetElement.nodeName === 'STRONG') {
              muteSuccessFlag = !(checkMuteLetter('mute_words', tweetElement));
            }
          }
        }

        return muteSuccessFlag;
      },
      /**
        check if the letters contains mute words, and return true or false
        @param:  a type of muting
        @param:  an element of tweet
        @return: true or false
      */
      checkMuteLetter = function (muteType, twiElement) {
        var nodeValueTemp = '',
            checkFlag = true,
            k,
            muteArray,
            muteArraySize;

        if (!!GM_getValue(muteType)) {
          if (addedFlag) {
            muteArray = addedMuteWord;
          } else {
            muteArray = muteWordsArray[muteType];
          }
          muteArraySize = muteArray.length;

          for (k = 0; k < muteArraySize && checkFlag; k++) {
            switch (muteType) {
              case 'mute_words':
                if (flagList.mute_text_flag) {
                  // text
                  if (twiElement.nodeName === '#text') {
                    checkFlag = (twiElement.nodeValue.indexOf(muteArray[k]) < 0);
                  }
                  // <STRONG> tag
                  else {
                    // add the previous text if it exists
                    if (
                      !!twiElement.previousSibling &&
                      twiElement.previousSibling.nodeName === '#text'
                    ) {
                      nodeValueTemp = twiElement.previousSibling.nodeValue;
                    }

                    // text of <STRONG> tag
                    nodeValueTemp += twiElement.childNodes[0].nodeValue;

                    // add the next text if it exists
                    if (
                      !!twiElement.nextSibling &&
                      twiElement.nextSibling.nodeName === '#text'
                    ) {
                      nodeValueTemp += twiElement.nextSibling.nodeValue;
                    }

                    checkFlag = (nodeValueTemp.indexOf(muteArray[k]) < 0);
                  }
                }
                break;
              case 'mute_links':
                if (flagList.mute_link_flag) {
                  // not "pic.twitter.com"
                  if (twiElement.hasAttribute('title')) {
                    checkFlag = (twiElement.getAttribute('title').indexOf(muteArray[k]) < 0);
                  }
                  // "pic.twitter.com"
                  else {
                    checkFlag = (twiElement.textContent.indexOf(muteArray[k]) < 0);
                  }
                }
                break;
              case 'mute_tags':
                checkFlag = !(flagList.mute_tag_flag && twiElement.childNodes[1].textContent.indexOf(muteArray[k]) >= 0);
                break;
              case 'mute_ids':
                checkFlag = !(flagList.mute_userId_flag && twiElement.childNodes[1].textContent.indexOf(muteArray[k]) >= 0);
                break;
            }
          }

          if (!checkFlag && !deletedFlag) {
            tweetParent.classList.add(VISIVILITY_CLASS);
          }
        }

        return !checkFlag;
      },
      // expand/contract the timeline
      tlExpandFlag,
      topBar,
      pageOuter,
      rightDashBoard,
      // MouseEvent
      mouseEvent,
      // move scroll bar
      autoRefreshFlag = false,
      screenHeight,
      // MutationObserver
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      config = { childList: true },
      // MutationObserver(Auto refresh)
      notifyNewTweetBtn = document.querySelector('[class="stream-item js-new-items-bar-container"]'),
      autoRefreshObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (!!mutation.addedNodes.length) {
            autoRefreshFlag = true;
            screenHeight = window.pageYOffset;
            mutation.addedNodes[0].dispatchEvent(mouseEvent);
          }
        });
      }),
      // MutationObserver(Timeline)
      streamItems = document.getElementById('stream-items-id'),
      addedTweetObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          var nodesList;

          if (!!mutation.addedNodes.length) {
            nodesList = mutation.addedNodes;
            muteTweet(nodesList);

            // a scroll bar is back
            if (autoRefreshFlag) {
              setTimeout(function() {
                var nodesWidth = 0,
                    nodesListSize = nodesList.length,
                    i;

                if (!!screenHeight) {
                  for (i = 0; i < nodesListSize; i++) {
                    nodesWidth += nodesList[i].clientHeight;
                  }
                  screenHeight += (nodesWidth - 38);
                }

                window.scrollTo(0, screenHeight);
              }, parseInt(flagList['time'], 10));

              autoRefreshFlag = false;
            }
          }
        });
      });

  GM_addStyle('.' + FORM_CLASS + ' { color: black; margin-right: 10px; } ');
  GM_addStyle('.' + TL_CLASS + ' { width: 100%; margin-left: 0px !important; margin-right: 0px !important; } ');
  GM_addStyle('.' + VISIVILITY_CLASS + ' { display: none; } ');
  GM_addStyle('.' + RADIO_BTN_CLASS + ' { font-weight: bold; color: #EE2C2C; } ');

  initSetting();
  setHeaderAndBtn();
  muteTweet();

  muteInputForm = document.getElementById('mLtrForm');

  for (key in formFlagList) {
    if (formFlagList.hasOwnProperty(key)) {
      formFlagList[key].push(document.getElementById(formFlagList[key][0]));
      if (GM_getValue(key)) {
        formFlagList[key][1].classList.add(RADIO_BTN_CLASS);
      }
    }
  }

  addedTweetObserver.observe(streamItems, config);

  if (GM_getValue('autoRefresh_flag')) {
    autoRefreshObserver.observe(notifyNewTweetBtn, config);
  }

  if (urlCheckFlag) {
    // init mouse event
    mouseEvent = document.createEvent('MouseEvents');
    mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    // set variables to expand the timeline
    tlExpandFlag = false;
    topBar = document.getElementById('doc').childNodes[1];
    pageOuter = document.getElementById('page-outer');
    rightDashBoard = pageContainer.childNodes[5];
  }

  // events of all buttons ----------------------------------------------------
  document.addEventListener('click', function (e) {
    var targetNode = e.target,
        tempFlag;

    switch (targetNode.id) {
      // input form
      case 'open_close':
        muteForm.classList.toggle(VISIVILITY_CLASS);

        tempFlag = !flagList.form_flag;
        flagList.form_flag = tempFlag;

        GM_setValue('form_flag', tempFlag);
        break;
      // tweet form
      case 'open_close_tweet':
        timelineHeader.classList.toggle(VISIVILITY_CLASS);
        break;
      // each muting button
      case 'mLtrAdd':
        btnFlag = document.querySelector('[checked]').value;
        addMuteLetter(muteInputForm.value);
        break;
      case 'mLtrRmv':
        btnFlag = document.querySelector('[checked]').value;
        delMuteLetter(muteInputForm.value);
        break;
      case 'mLtrConf':
        btnFlag = document.querySelector('[checked]').value;
        confMuteLetter();
        break;
      // other
      default:
        // radio buttons
        if (targetNode.name === 'muteLetter') {
          // remove the attribute "checked", if it already exists
          if (!!document.querySelector('[checked]')) {
            document.querySelector('[checked]').removeAttribute('checked');
          }
          targetNode.setAttribute('checked', 'checked');
        }
        // expand/contract the timeline
        else if (targetNode.className === 'top-timeline-tweet-box-user-image avatar size32') {
          timeline.classList.toggle(TL_CLASS);
          topBar.classList.toggle(VISIVILITY_CLASS);
          pageContainer.classList.toggle(VISIVILITY_CLASS);

          if (tlExpandFlag) {
            pageContainer.insertBefore(timeline, rightDashBoard);

            if (flagList.form_flag) {
              muteForm.classList.remove(VISIVILITY_CLASS);
            }
          } else {
            pageOuter.insertBefore(timeline, pageContainer);
            muteForm.classList.add(VISIVILITY_CLASS);
          }

          tlExpandFlag = !tlExpandFlag;
        }
        break;
    }
  }, false);
})();