How to use (使い方)
===================
1. Install Greasemonkey([en-US](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) / [ja](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/)) on Firefox / [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) on Chrome.
2. Visit [Raw page of this user script](https://raw.githubusercontent.com/mosaicer/Muting_on_Twitter/master/Muting_on_Twitter.user.js).
3. Install this user script.
4. Enjoy your Twitter Life!

Features (機能)
===============
__This user script enables to mute texts/links/tags/userIDs on "Twitter Web Client".__
* __This user script also works on "Search page" and "List page".__
* __Your timeline is refreshed automatically.__
  - you disable/enable this feature by using command menus.
* This user script decides a language from a language of your browser.
  - when Japanese is used, please confirm a language of your browser.
* __You can add/delete plural letters.__
  - please divide them by the letter `,/`. (Ex: Firefox`,/`Chrome)
* Some user script commands are prepared.
  - you can choose necessary features for you _without reloading the page_.

__This user script enables expanding the timeline.__

![the expanded timeline](https://box.c.yimg.jp/res/box-s-ifzsxby3sf3p7ibx45hzwgzsne-1001?uid=2ff38f21-1023-44d9-9b3d-c06843d431a2&etag=d32d125f1419157813325432 "the expanded timeline")

__This user script changes tweets' style.__
* promoted tweets are removed.
* letters which represent username and userID turn red.
* letters which represent time turn blue.
* texts(contents) of tweets are emphasized.

![Firefox+Greasemoneky](https://box.c.yimg.jp/res/box-s-ifzsxby3sf3p7ibx45hzwgzsne-1001?uid=5cc76a38-aae5-4091-a104-edc6ded4eb69&etag=27603db9141915781190803 "Firefox+Greasemoneky")

__This user script can set background image on home.__
* please input the url of background image to prompt from command menus.

----------------------------------------------------------------------------------

__このユーザースクリプトは、テキスト/リンク/タグ/ユーザーIDをミュートすることができます。__
* __検索ページでもホームのページと同じようにミュートできます。__
* __タイムラインは自動的に更新されます。__
  - この機能はユーザースクリプトコマンドメニューから無効にできます。
* 使っているブラウザの言語から日本語か英語のどちらを使うかを判断します。
  - 日本語にならない場合はブラウザの言語設定をご確認ください。
* __複数の文字をミュートリストに追加/削除することができます。__
  - ミュートしたい文字を`,/`で区切って入力してください。 (例：Firefox`,/`Chrome)
* いくつかのユーザースクリプトコマンドメニューが用意されています。
  - 必要な機能だけを選んで使うことができます。
    + _使用する際、ページの更新をする必要はありません。_

__タイムラインを拡大することができます。__
* 画像は上記のものをご覧ください。

__また、ツイートのスタイルを変更します。__
* プロモーションのツイートを消去します。
* ユーザーネーム・ユーザーIDは赤く、時間は青くします。
* ツイート本文は太字になります。

![Firefox+Greasemonekyで動かしたときのスクリーンショット](https://box.c.yimg.jp/res/box-s-ifzsxby3sf3p7ibx45hzwgzsne-1001?uid=267457e0-db3a-4986-bb15-e30368741e3a&etag=a8c4f43a141915781098919 "Firefox+Greasemonekyで動かしたときのスクリーンショット")

__ホームの背景画像をセットすることができます。__
* コマンドメニューから背景画像のURLを入力してください。

Notes (備考)
=============
* __This user script is instable on "Search page".__
  - The details are described on Issues.
  - _When you find bugs, please report them._
* __Please reset time as to a feature of auto refresh by using command menus, if necessary.__
  - If a scroll bar is not back, you should increase time.
  - If a scroll bar is back, it should become more comfortable by decreasing time.
  - _If you reset time and a scroll bar is not still back, please report the details._
  - Default is `200`.
* __User script pages on Greasy Fork__
  - [Muting on Twitter](https://greasyfork.org/scripts/4154-muting-on-twitter)
  - [Twitter Style Changer](https://greasyfork.org/scripts/4175-twitter-style-changer)
