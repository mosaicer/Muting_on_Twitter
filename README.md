# Supporting new Twitter UI is in progress on the branch [support-newTwitterUI](https://github.com/mosaicer/Muting_on_Twitter/tree/support-newTwitterUI).

***

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

![the expanded timeline](https://box.c.yimg.jp/res/box-l-ifzsxby3sf3p7ibx45hzwgzsne-1001?uid=a45b5a48-61f2-483c-9001-dcbfdccc81ca&etag=6696f1cde7f91ef4b9d9884c9f702c9a "the expanded timeline")

__This user script removes some annoying tweets.__
* Promoted tweets.
* Suggested tweets.
* Highlights.
* Recently recommended users.

![Firefox+Greasemoneky](https://box.c.yimg.jp/res/box-l-ifzsxby3sf3p7ibx45hzwgzsne-1001?uid=50a81d94-f68e-422a-ac75-bf78f04c32f3&etag=15d072f4ebc353a8db769b27ab246b6d "Firefox+Greasemoneky")

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

__いくつかの迷惑なツイートを消去します。__
* プロモーションのツイート
* フォロイーのいいね/リツイート
* ハイライト
* 最近のオススメユーザー

![Firefox+Greasemonekyで動かしたときのスクリーンショット](https://box.c.yimg.jp/res/box-l-ifzsxby3sf3p7ibx45hzwgzsne-1001?uid=18852d81-11e7-4c2b-ac74-37ed38ae63c0&etag=b011505e3767a384a6f79ab30008d5c3 "Firefox+Greasemonekyで動かしたときのスクリーンショット")

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
