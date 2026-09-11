#!/bin/bash
cat << 'HTML_HEAD' > shopping-calc-allinone.html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#4CAF50">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="買い物メモ">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <title>買い物計算メモ</title>
  <style>
HTML_HEAD

cat style.css >> shopping-calc-allinone.html

cat << 'HTML_MID' >> shopping-calc-allinone.html
  </style>
</head>
<body>
HTML_MID

sed -n '/<div id="app">/,/<\/div>/p' index.html >> shopping-calc-allinone.html

cat << 'HTML_FOOT_1' >> shopping-calc-allinone.html
  <script>
HTML_FOOT_1

cat app.js >> shopping-calc-allinone.html

cat << 'HTML_FOOT_2' >> shopping-calc-allinone.html
  </script>
</body>
</html>
HTML_FOOT_2
chmod +x generate_allinone.sh
./generate_allinone.sh
