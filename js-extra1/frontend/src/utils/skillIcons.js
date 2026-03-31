/**
 * Skill → Devicon CDN icon mapping.
 * Uses https://cdn.jsdelivr.net/gh/devicons/devicon/icons/
 * All SVG, free & open-source.
 *
 * The key is lowercase, the lookup normalises user input before matching.
 */

const BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const ICON_MAP = {
  // ── Languages ──
  html: `${BASE}/html5/html5-original.svg`,
  html5: `${BASE}/html5/html5-original.svg`,
  css: `${BASE}/css3/css3-original.svg`,
  css3: `${BASE}/css3/css3-original.svg`,
  javascript: `${BASE}/javascript/javascript-original.svg`,
  js: `${BASE}/javascript/javascript-original.svg`,
  typescript: `${BASE}/typescript/typescript-original.svg`,
  ts: `${BASE}/typescript/typescript-original.svg`,
  python: `${BASE}/python/python-original.svg`,
  java: `${BASE}/java/java-original.svg`,
  "c++": `${BASE}/cplusplus/cplusplus-original.svg`,
  cpp: `${BASE}/cplusplus/cplusplus-original.svg`,
  "c#": `${BASE}/csharp/csharp-original.svg`,
  csharp: `${BASE}/csharp/csharp-original.svg`,
  c: `${BASE}/c/c-original.svg`,
  go: `${BASE}/go/go-original.svg`,
  golang: `${BASE}/go/go-original.svg`,
  rust: `${BASE}/rust/rust-original.svg`,
  swift: `${BASE}/swift/swift-original.svg`,
  kotlin: `${BASE}/kotlin/kotlin-original.svg`,
  dart: `${BASE}/dart/dart-original.svg`,
  ruby: `${BASE}/ruby/ruby-original.svg`,
  php: `${BASE}/php/php-original.svg`,
  r: `${BASE}/r/r-original.svg`,
  scala: `${BASE}/scala/scala-original.svg`,
  perl: `${BASE}/perl/perl-original.svg`,
  lua: `${BASE}/lua/lua-original.svg`,
  elixir: `${BASE}/elixir/elixir-original.svg`,
  haskell: `${BASE}/haskell/haskell-original.svg`,
  matlab: `${BASE}/matlab/matlab-original.svg`,

  // ── Frontend ──
  react: `${BASE}/react/react-original.svg`,
  "react.js": `${BASE}/react/react-original.svg`,
  reactjs: `${BASE}/react/react-original.svg`,
  "react native": `${BASE}/react/react-original.svg`,
  angular: `${BASE}/angularjs/angularjs-original.svg`,
  "angular.js": `${BASE}/angularjs/angularjs-original.svg`,
  angularjs: `${BASE}/angularjs/angularjs-original.svg`,
  vue: `${BASE}/vuejs/vuejs-original.svg`,
  "vue.js": `${BASE}/vuejs/vuejs-original.svg`,
  vuejs: `${BASE}/vuejs/vuejs-original.svg`,
  svelte: `${BASE}/svelte/svelte-original.svg`,
  "next.js": `${BASE}/nextjs/nextjs-original.svg`,
  nextjs: `${BASE}/nextjs/nextjs-original.svg`,
  nuxt: `${BASE}/nuxtjs/nuxtjs-original.svg`,
  "nuxt.js": `${BASE}/nuxtjs/nuxtjs-original.svg`,
  gatsby: `${BASE}/gatsby/gatsby-original.svg`,
  ember: `${BASE}/ember/ember-original-wordmark.svg`,
  backbone: `${BASE}/backbone/backbone-original.svg`,
  jquery: `${BASE}/jquery/jquery-original.svg`,

  // ── CSS Frameworks ──
  tailwind: `${BASE}/tailwindcss/tailwindcss-original.svg`,
  tailwindcss: `${BASE}/tailwindcss/tailwindcss-original.svg`,
  "tailwind css": `${BASE}/tailwindcss/tailwindcss-original.svg`,
  bootstrap: `${BASE}/bootstrap/bootstrap-original.svg`,
  sass: `${BASE}/sass/sass-original.svg`,
  scss: `${BASE}/sass/sass-original.svg`,
  less: `${BASE}/less/less-plain-wordmark.svg`,
  materialui: `${BASE}/materialui/materialui-original.svg`,
  "material ui": `${BASE}/materialui/materialui-original.svg`,

  // ── Backend / Runtime ──
  "node.js": `${BASE}/nodejs/nodejs-original.svg`,
  nodejs: `${BASE}/nodejs/nodejs-original.svg`,
  node: `${BASE}/nodejs/nodejs-original.svg`,
  express: `${BASE}/express/express-original.svg`,
  "express.js": `${BASE}/express/express-original.svg`,
  expressjs: `${BASE}/express/express-original.svg`,
  nestjs: `${BASE}/nestjs/nestjs-original.svg`,
  django: `${BASE}/django/django-plain.svg`,
  flask: `${BASE}/flask/flask-original.svg`,
  fastapi: `${BASE}/fastapi/fastapi-original.svg`,
  spring: `${BASE}/spring/spring-original.svg`,
  "spring boot": `${BASE}/spring/spring-original.svg`,
  rails: `${BASE}/rails/rails-original-wordmark.svg`,
  "ruby on rails": `${BASE}/rails/rails-original-wordmark.svg`,
  laravel: `${BASE}/laravel/laravel-original.svg`,
  dotnet: `${BASE}/dot-net/dot-net-original.svg`,
  ".net": `${BASE}/dot-net/dot-net-original.svg`,

  // ── Databases ──
  mongodb: `${BASE}/mongodb/mongodb-original.svg`,
  mongo: `${BASE}/mongodb/mongodb-original.svg`,
  mysql: `${BASE}/mysql/mysql-original.svg`,
  postgresql: `${BASE}/postgresql/postgresql-original.svg`,
  postgres: `${BASE}/postgresql/postgresql-original.svg`,
  redis: `${BASE}/redis/redis-original.svg`,
  sqlite: `${BASE}/sqlite/sqlite-original.svg`,
  oracle: `${BASE}/oracle/oracle-original.svg`,
  firebase: `${BASE}/firebase/firebase-plain.svg`,
  supabase: `${BASE}/supabase/supabase-original.svg`,
  dynamodb: `${BASE}/dynamodb/dynamodb-original.svg`,

  // ── DevOps / Cloud ──
  docker: `${BASE}/docker/docker-original.svg`,
  kubernetes: `${BASE}/kubernetes/kubernetes-plain.svg`,
  k8s: `${BASE}/kubernetes/kubernetes-plain.svg`,
  aws: `${BASE}/amazonwebservices/amazonwebservices-plain-wordmark.svg`,
  "amazon web services": `${BASE}/amazonwebservices/amazonwebservices-plain-wordmark.svg`,
  azure: `${BASE}/azure/azure-original.svg`,
  gcp: `${BASE}/googlecloud/googlecloud-original.svg`,
  "google cloud": `${BASE}/googlecloud/googlecloud-original.svg`,
  heroku: `${BASE}/heroku/heroku-original.svg`,
  vercel: `${BASE}/vercel/vercel-original.svg`,
  netlify: `${BASE}/netlify/netlify-original.svg`,
  nginx: `${BASE}/nginx/nginx-original.svg`,
  terraform: `${BASE}/terraform/terraform-original.svg`,
  jenkins: `${BASE}/jenkins/jenkins-original.svg`,
  ansible: `${BASE}/ansible/ansible-original.svg`,
  circleci: `${BASE}/circleci/circleci-plain.svg`,

  // ── Tools ──
  git: `${BASE}/git/git-original.svg`,
  github: `${BASE}/github/github-original.svg`,
  gitlab: `${BASE}/gitlab/gitlab-original.svg`,
  bitbucket: `${BASE}/bitbucket/bitbucket-original.svg`,
  vscode: `${BASE}/vscode/vscode-original.svg`,
  "visual studio code": `${BASE}/vscode/vscode-original.svg`,
  vim: `${BASE}/vim/vim-original.svg`,
  webpack: `${BASE}/webpack/webpack-original.svg`,
  babel: `${BASE}/babel/babel-original.svg`,
  vite: `${BASE}/vitejs/vitejs-original.svg`,
  npm: `${BASE}/npm/npm-original-wordmark.svg`,
  yarn: `${BASE}/yarn/yarn-original.svg`,
  eslint: `${BASE}/eslint/eslint-original.svg`,
  figma: `${BASE}/figma/figma-original.svg`,
  "adobe xd": `${BASE}/xd/xd-plain.svg`,
  photoshop: `${BASE}/photoshop/photoshop-plain.svg`,
  illustrator: `${BASE}/illustrator/illustrator-plain.svg`,
  sketch: `${BASE}/sketch/sketch-original.svg`,
  postman: `${BASE}/postman/postman-original.svg`,
  jira: `${BASE}/jira/jira-original.svg`,
  confluence: `${BASE}/confluence/confluence-original.svg`,
  slack: `${BASE}/slack/slack-original.svg`,
  trello: `${BASE}/trello/trello-plain.svg`,

  // ── Mobile ──
  flutter: `${BASE}/flutter/flutter-original.svg`,
  android: `${BASE}/android/android-original.svg`,
  ios: `${BASE}/apple/apple-original.svg`,
  apple: `${BASE}/apple/apple-original.svg`,
  xamarin: `${BASE}/xamarin/xamarin-original.svg`,

  // ── AI / ML / Data ──
  tensorflow: `${BASE}/tensorflow/tensorflow-original.svg`,
  pytorch: `${BASE}/pytorch/pytorch-original.svg`,
  pandas: `${BASE}/pandas/pandas-original.svg`,
  numpy: `${BASE}/numpy/numpy-original.svg`,
  jupyter: `${BASE}/jupyter/jupyter-original.svg`,
  opencv: `${BASE}/opencv/opencv-original.svg`,

  // ── Testing ──
  jest: `${BASE}/jest/jest-plain.svg`,
  mocha: `${BASE}/mocha/mocha-plain.svg`,
  selenium: `${BASE}/selenium/selenium-original.svg`,
  cypress: `${BASE}/cypressio/cypressio-original.svg`,
  storybook: `${BASE}/storybook/storybook-original.svg`,

  // ── Other ──
  graphql: `${BASE}/graphql/graphql-plain.svg`,
  linux: `${BASE}/linux/linux-original.svg`,
  ubuntu: `${BASE}/ubuntu/ubuntu-plain.svg`,
  bash: `${BASE}/bash/bash-original.svg`,
  powershell: `${BASE}/powershell/powershell-original.svg`,
  markdown: `${BASE}/markdown/markdown-original.svg`,
  wordpress: `${BASE}/wordpress/wordpress-plain.svg`,
  shopify: `${BASE}/shopify/shopify-original.svg`,
  threejs: `${BASE}/threejs/threejs-original.svg`,
  "three.js": `${BASE}/threejs/threejs-original.svg`,
  electron: `${BASE}/electron/electron-original.svg`,
  socketio: `${BASE}/socketio/socketio-original.svg`,
  "socket.io": `${BASE}/socketio/socketio-original.svg`,
  redux: `${BASE}/redux/redux-original.svg`,
  blender: `${BASE}/blender/blender-original.svg`,
  unity: `${BASE}/unity/unity-original.svg`,
  "unreal engine": `${BASE}/unrealengine/unrealengine-original.svg`,
  raspberrypi: `${BASE}/raspberrypi/raspberrypi-original.svg`,
  arduino: `${BASE}/arduino/arduino-original.svg`,
};

/**
 * Returns the Devicon CDN URL for a given skill name, or null if not found.
 */
export const getSkillIconUrl = (skillName) => {
  if (!skillName) return null;
  const key = skillName.trim().toLowerCase().replace(/\s+/g, " ");
  return ICON_MAP[key] || null;
};

export default ICON_MAP;
