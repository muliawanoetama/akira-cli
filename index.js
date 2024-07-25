#!/usr/bin/env zx
import 'dotenv/config';
import 'zx/globals';
import _ from 'lodash';
import * as semver from 'semver';
import { select, input, confirm } from '@inquirer/prompts';
$.verbose = false;

// run this sequentially: test, server-install, install, commit-dna, server-config; then commit-dna, update, ...
// run 'commit-dna' when there is change in: ./public/logo.png, ./public/logoWithText.png, ./dna/structure.js, or when just after install
// no need to run 'commit-dna' when there is change in: ./dna/theme.js, ./dna/*.theme.template.js
// file generate automatically by 'commit-dna':
// - ./db/*.*
// - ./dna/localeFormat.ts, defaultSession.ts, faviconData.json, faviconDescription.json
// - ./public/*.png, *.svg, favicon.ico, browserconfig.xml, site.webmanifest except logo.png, logoWithText.png

// check again:
// - ./public/robots.txt
// - ./public/site.webmanifest
// - ./public/sitemap.xml
// delete ./script
// remove drizzle.config.js
// change drizzle.config.ts to:
// import 'dotenv/config';
// import { defineConfig } from 'drizzle-kit';
// export default defineConfig({
// dialect: 'postgresql',
// schema: './db/schema.ts',
// out: './db/migrations',
// dbCredentials: {
//     url: process.env.DATABASE_URL,
// },
// });

// requirementsConfig = [{checkScript, requirementVersion, errorMessage }, ...]
async function checkRequirement(requirementsConfig) {
    for (let i in requirementsConfig) {
        const x = requirementsConfig[i];
        let currentVersionT;
        if (x.checkScript=='ubuntu') {
            currentVersionT = await $`lsb_release -r | awk '{print $2}'`;
        }
        else if (x.checkScript=='node') {
            currentVersionT = await $`node -v`;
        }
        else if (x.checkScript=='npm') {
            currentVersionT = await $`npm -v`;
        }
        let currentVersion = currentVersionT?.stdout?.trim();
        if (x.checkScript=='ubuntu') {
            currentVersion = currentVersion?.split('.')?.[0] + '.0.0';
        }
        if (!semver.satisfies(currentVersion, x?.requirementVersion)) {
            throw Error(x?.errorMessage);
        }
    }
}

// optionsConfig = [{ key, optionsValue, defaultValue, questionMessage, errorMessageWhenUndefined }, ...]
async function getOptionsValue(optionsConfig) {
    let r = {};
    for (let i in optionsConfig) {
        const x = optionsConfig[i];
        const key = x?.key;
        const keyArgument = _.kebabCase(key);
        if (argv?.[keyArgument]) {
            r = {
                ...r,
                [key]: argv?.[keyArgument]
            };
        }
        else {
            // ask question
            let answer;
            while (!answer) {
                if (x?.optionsValue?.length > 0) {
                    answer = await select({
                        message: x?.questionMessage,
                        choices: x?.optionsValue?.map(y => ({
                            value: y?.value,
                            name: y?.label,
                        })),
                    });
                }
                else {
                    answer = await input({
                        message: x?.questionMessage,
                    });
                }
                if (answer === undefined) {
                    if (defaultValue === undefined) {
                        console.log(x?.errorMessageWhenUndefined);
                    }
                    else {
                        answer = defaultValue;
                    }
                }
            }
            r = {
                ...r,
                [key]: answer ?? null,
            }
        }
    }
    return r;
}

function changeConfig(fileConfigPath, configKey, configValue) {
    let fileContent = fs.readFileSync(fileConfigPath, 'utf8');
    const config = configKey + ' = ' + configValue;

    const regex = new RegExp(`^${configKey}.*$`, 'm');
    if (regex.test(fileContent)) {
        fileContent = fileContent?.replace(regex, config);
    }
    else {
        fileContent += `\n${config}\n`;
    }

    fs.writeFileSync(fileConfigPath, fileContent);
}

const sourceRepository = 'akira';
const templateList = {
    'person-profile': 'Person Profile',
    'blog-news': 'Blog / News',
    'company-profile': 'Company Profile',
    'social-media': 'Social Media',
    commerce: 'Commerce',
    marketplace: 'Marketplace',
    manufacture: 'Manufacture',
    custom: 'Custom'
};
const files0 = {
    'package.json': true,
    'postcss.config.js': true,
    'tailwind.config.js': true,
    'jsconfig.json': true,
    'tsconfig.json': true,
    'next-env.d.ts': true,
    'drizzle.config.js': true,
    'vitest.config.ts': true,
    'middleware.js': true,
    'dna/tailwindui.theme.template.js': true,
    'dna/radixui.theme.template.js': true,
    'dna/builtin.structure.template.js': true,
    'components/*.js': true,
    'pages/_app.js': true,
    'pages/404.js': true,
    'pages/500.js': true,
    'pages/api/*.js': true,
    'pages/administrator/*.js': true,
    'pages/index.js': true,
    'pages/about.js': ['blog-news', 'company-profile', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/affiliate-program.js': ['commerce', 'marketplace', 'custom'],
    'pages/career.js': ['company-profile', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/contact-us.js': ['blog-news', 'company-profile', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/faq.js': ['company-profile', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/legal.js': ['blog-news', 'company-profile', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/our-team.js': ['company-profile', 'custom'],
    'pages/portfolio.js': ['person-profile', 'company-profile', 'manufacture', 'custom'],
    'pages/pricing.js': ['social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/release-notes.js': ['company-profile', 'commerce', 'custom'],
    'pages/security.js': ['blog-news', 'company-profile', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/status.js': ['company-profile', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/testimonial.js': ['person-profile', 'company-profile', 'commerce', 'custom'],
    'pages/blog/**/*.js': ['person-profile', 'blog-news', 'company-profile', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/news/**/*.js': ['blog-news', 'company-profile', 'social-media', 'commerce', 'marketplace', 'custom'],
    'pages/documentation/**/*.js': ['social-media', 'commerce', 'marketplace', 'custom'],
    'pages/product/**/*.js': ['company-profile', 'commerce', 'marketplace', 'custom'],
    'pages/user/index.js': ['blog-news', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/user/setting.js': ['blog-news', 'social-media', 'commerce', 'marketplace', 'manufacture', 'custom'],
    'pages/user/cart.js': ['commerce', 'marketplace', 'custom'],
    'pages/user/checkout/*.js': ['commerce', 'marketplace', 'custom'],
    'pages/user/order.js': ['commerce', 'marketplace', 'custom'],
    'pages/business/**/*.js': ['social-media', 'marketplace', 'custom'],
    'pages/order/**/*.js': ['commerce', 'marketplace', 'custom'],
};
const filesCreateOnly0 = [
    '.gitignore',
    'next.config.js',
    'dna/theme.js',
    'dna/structure.js', // from 'dna/sample.structure.js'
    'public/logo.png',
    'public/logoWithText.png',
    'public/robots.txt',
    'public/sitemap.xml',
    'public/sample/*.*',
];

try {
    // add .ts to files and filesCreateOnly
    const files = Object.entries(files0)?.reduce((xAcc, [k, v]) => {
        if (k?.endsWith('.js')) {
            return {
                ...xAcc,
                [k]: v,
                [k?.slice(0, -3) + '.ts']: v,
            };
        }
        else {
            return {
                ...xAcc,
                [k]: v,
            };
        }
    }, {});
    const filesCreateOnly = filesCreateOnly0?.map(x => {
        if (x?.endsWith('.js')) {
            return [
                x,
                x?.slice(0, -3) + '.ts'
            ];
        }
        else {
            return x;
        }
    })?.flat();

    // get 'action' argument
    const [notUsed, action, testA, testB] = argv._;
    if (!['test', 'install', 'update', 'commit-dna', 'server-install', 'server-config'].includes(action)) {
        throw new Error('Please add valid action (install / update / commit-dna / test / server-install / server-config), example: "npx akira-cli update"');
    }

    // make sure run as sudo
    if (action == 'server-install' || action == 'server-config') {
        // Check if the script is run as root
        if (os.userInfo().uid !== 0) {
            throw new Error('You must run this as sudo');
        }
    }

    // check requirement
    if (action == 'install' || action == 'update') {
        await checkRequirement([
            { checkScript: 'node', requirementVersion: '>=20.0.0', errorMessage: 'Node version must be >=20.0.0' },
            { checkScript: 'npm', requirementVersion: '>=10.0.0', errorMessage: 'npm version must be >=10.0.0' },
        ]);
    }
    else if (action == 'server-install') {
        // await checkRequirement([
        //     { checkScript: 'ubuntu', requirementVersion: '>=20.0.0 <21.0.0', errorMessage: 'Ubuntu version must be version 20' },
        // ]);
    }

    // get options
    let options = {};
    if (action == 'install') {
        options = await getOptionsValue([
            {
                key: 'githubPaToken',
                questionMessage: 'Github PA Token for repository "muliawanoetama/' + sourceRepository + '.git":',
                errorMessageWhenUndefined: 'You must provide Github PA Token for repository "muliawanoetama/' + sourceRepository + '.git".',
            },
            {
                key: 'projectName',
                defaultValue: 'no-project-name',
                questionMessage: 'Name of your project (use lowercase) (default=no-project-name):',
            },
            {
                key: 'projectAuthor',
                defaultValue: '',
                questionMessage: 'What is your name (default=):',
            },
            {
                key: 'template',
                optionsValue: Object.entries(templateList)?.map(([k, v]) => ({
                    value: k,
                    label: v,
                })),
                defaultValue: 'custom',
                questionMessage: 'Choose template for this project:',
            },
        ]);
    }
    else if (action == 'update') {
        options = await getOptionsValue([
            {
                key: 'githubPaToken',
                questionMessage: 'Github PA Token for repository "muliawanoetama/' + sourceRepository + '.git":',
                errorMessageWhenUndefined: 'You must provide Github PA Token for repository "muliawanoetama/' + sourceRepository + '.git".',
            },
        ]);
        // check ./akira.json
        if (!fs.existsSync('./akira.json')) {
            const isNewProject = await confirm({
                message: 'We did not find "akira.json" file in this directory. Is this new project?',
                default: false,
            });
            if (isNewProject) {
                throw new Error('To install new project, run "npx akira-cli install".');
            }
            else {
                throw new Error('You must run "npx akira-cli update" in your root project.');
            }
        }
        else {
            // get ./akira.json data into options
            const akiraConfig = fs.readJsonSync('./akira.json');
            options.projectName = akiraConfig?.projectName ? akiraConfig?.projectName : 'no-project-name';
            options.projectAuthor = akiraConfig?.projectAuthor ? akiraConfig?.projectAuthor : '';
            options.template = akiraConfig?.template ? akiraConfig?.template : 'custom';
        }
    }
    else if (action == 'commit-dna') {
        options.siteUrl = process?.env?.SITE_URL;
    }
    else if (action == 'server-install') {
        options = await getOptionsValue([
            {
                key: 'homePath',
                questionMessage: 'Home path (example: /home/administrator):',
                errorMessageWhenUndefined: 'You must provide home path.',
            },
            {
                key: 'databaseHost',
                defaultValue: 'localhost',
                questionMessage: 'Postgres host address (localhost, or IP address) (default=localhost):',
            },
            {
                key: 'databasePort',
                defaultValue: '5432',
                questionMessage: 'Postgres port (default=5432):',
            },
            {
                key: 'databaseRootPassword',
                questionMessage: 'Postgres password for root / postgres:',
                errorMessageWhenUndefined: 'You must provide root password.',
            },
            {
                key: 'databaseUsername',
                questionMessage: 'Postgres new username:',
                errorMessageWhenUndefined: 'You must provide new username.',
            },
            {
                key: 'databasePassword',
                questionMessage: 'Postgres password for new username:',
                errorMessageWhenUndefined: 'You must provide password for new username.',
            },
        ]);
        options.databaseRootUrl = 'postgres://postgres:@' + options?.databaseHost + ':' + options?.databasePort + '/postgres';
    }
    else if (action == 'server-config') {
        options = await getOptionsValue([
            {
                key: 'homePath',
                questionMessage: 'Home path (example: /home/administrator):',
                errorMessageWhenUndefined: 'You must provide home path.',
            },
            {
                key: 'projectName',
                questionMessage: 'Project Name:',
                errorMessageWhenUndefined: 'You must provide project name.',
            },
            {
                key: 'projectDomain',
                questionMessage: 'Project Domain (example: sub.domain.com):',
                errorMessageWhenUndefined: 'You must provide project domain.',
            },
            {
                key: 'port',
                questionMessage: 'Application port (must be different from other app ports):',
                errorMessageWhenUndefined: 'You must provide app port.',
            },
            {
                key: 'databaseHost',
                defaultValue: 'localhost',
                questionMessage: 'Postgres host address (localhost, or IP address) (default=localhost):',
            },
            {
                key: 'databasePort',
                defaultValue: '5432',
                questionMessage: 'Postgres port (default=5432):',
            },
            {
                key: 'databaseUsername',
                questionMessage: 'Postgres username:',
                errorMessageWhenUndefined: 'You must provide username.',
            },
            {
                key: 'databasePassword',
                questionMessage: 'Postgres password:',
                errorMessageWhenUndefined: 'You must provide password.',
            },
        ]);
        options.developmentProjectName = options?.projectName + '-dev';
        options.developmentProjectDomain = options?.projectDomain?.split('.')?.map((x, xIndex) => xIndex === 0 ? x + '-dev' : x)?.join('.');
        options.developmentPort = 53000 ?? 50000 + options?.port;
        options.databaseUrl = 'postgres://' + options?.databaseUsername + ':' + options?.databasePassword + '@' + options?.databaseHost + ':' + options?.databasePort + '/' + options?.projectName;
    }

    // get overwrite confirmation
    if (action == 'update') {
        const overwriteConfirmation = await confirm({
            message: 'Please make sure you have added first line prefix "// modified" to each file that you change manually. This will prevent those files from being overwritten. Can you confirm this?',
            default: false,
        });
        if (!overwriteConfirmation) {
            throw new Error('You must add first line prefix "// modified" to each file that you change manually.');
        }
    }

    console.log('action', action);
    console.log('options', options);
    throw new Error('exit');

    // copy muliawanoetama/akira.git to temporary folder ./.akira/
    if (action == 'install' || action == 'update') {
        await $`rm -rf ./akira/`;
        await $`mkdir .akira`;
        await $`git clone https://${options?.githubPersonalAccessToken}@github.com/muliawanoetama/${sourceRepository}.git ./.akira/`;
    }

    // main
    if (action == 'test') {
        console.log('Test: ' + (testA ?? 0) + ' + ' + (testB ?? 0) + ' = ' + ((testA ?? 0) + (testB ?? 0)));
    }
    else if (action == 'install') {
        // copy files
        await $`mkdir __tests__`;
        await $`mkdir db`;
        const basePath = './.akira/' + sourceRepository + '/';
        const selectedFiles = await globby([
            ...filesCreateOnly?.map(x => basePath + x),
            ...(Object.entries(files)?.map(([k, v]) => {
                let isInclude = false;
                if (Array.isArray(v)) {
                    isInclude = v.includes(options?.template);
                }
                else if (v === true) {
                    isInclude = true;
                }
                if (isInclude) {
                    return k;
                }
                else {
                    return null;
                }
            })?.filter(x => x !== null)?.map(x => basePath + x) ?? []),
        ]);
        selectedFiles?.map(x => {
            const src = x;
            const dest = src?.replace(basePath, './');
            fs.copySync(src, dest, {
                overwrite: true,
                preserveTimestamps: true,
            });
            console.log('- copy file', src, dest);
        });

        // modified package.json
        const packageJson = fs.readJsonSync('./package.json');
        fs.writeFileSync('./package.json', JSON.stringify({
            ...packageJson,
            name: options?.projectName ?? 'no-project-name',
            author: options?.projectAuthor ?? '',
        }));

        // create .env
        fs.writeFileSync('./.env', `
SITE_URL=
SITE_PATH=
SITE_LOGPATH=
CDN_PATH=
CDN_PROVIDER=
DATABASE_URL=
AUTH_TIMEOUT=
AUTH_SERVICEPASSWORD=
AUTH_WEBHOOKPASSWORD=
ENCRYPT_KEY=
PRIVATEAPI_GOOGLECLIENTID=
PRIVATEAPI_GOOGLECLIENTSECRET=
PRIVATEAPI_FACEBOOKAPPID=
PRIVATEAPI_FACEBOOKAPPSECRET=
PRIVATEAPI_GITHUBCLIENTID=
PRIVATEAPI_GITHUBCLIENTSECRET=
PRIVATEAPI_MAILJETID=
PRIVATEAPI_MAILJETSECRET=
PRIVATEAPI_MIDTRANSCLIENTID=
PRIVATEAPI_MIDTRANSCLIENTKEY=
PRIVATEAPI_MIDTRANSSERVERKEY=
PRIVATEAPI_PAYPALAPPID=
PRIVATEAPI_PAYPALAPPSECRET=
PRIVATEAPI_BITESHIP=
PRIVATEAPI_GOOGLE=
PRIVATEAPI_GOOGLE2=
PRIVATEAPI_GOOGLEANALYTIC_TAG=
PRIVATEAPI_DIGITALOCEAN=
PRIVATEAPI_OPENEXCHANGERATE=
PRIVATEAPI_IMAGEKIT=
PUBLICAPI_IMAGEKIT=`);
        console.log('Please modify the .env file after this script has finished executing.');

        // create akira.json
        fs.writeFileSync('./akira.json', JSON.stringify({
            projectName: options?.projectName,
            projectAuthor: options?.projectAuthor,
            template: options?.template,
        }));
    }
    else if (action == 'update') {
        // copy and overwrite file that don't have prefixs "// modified"
        const basePath = './.akira/' + sourceRepository + '/';
        const selectedFiles = await globby([
            ...(Object.entries(files)?.map(([k, v]) => {
                let isInclude = false;
                if (Array.isArray(v)) {
                    isInclude = v.includes(options?.template);
                }
                else if (v === true) {
                    isInclude = true;
                }
                if (isInclude) {
                    return k;
                }
                else {
                    return null;
                }
            })?.filter(x => x !== null)?.map(x => basePath + x) ?? []),
        ]);
        selectedFiles?.map(x => {
            const src = x;
            const dest = src?.replace(basePath, './');
            if (fs.existsSync(dest)) {
                const content = fs.readFileSync(dest);
                const firstLineContent = content?.split('\n')?.find(y => {
                    return y?.trim();
                })?.trim();
                console.log('- old file first line', dest, firstLineContent);
            }
            if (!['// modified', '//modified', 'modified'].includes(firstLineContent)) {
                fs.copySync(src, dest, {
                    overwrite: true,
                    preserveTimestamps: true,
                });
                console.log('- copy overwrite file', src, dest);
            }
        });

        // modified package.json
        const packageJson = fs.readJsonSync('./package.json');
        fs.writeFileSync('./package.json', JSON.stringify({
            ...packageJson,
            name: options?.projectName ?? 'no-project-name',
            author: options?.projectAuthor ?? '',
        }));
    }
    else if (action == 'commit-dna') {
        // automatically generate value for logoPrimaryColor in ./dna/*.theme.template.js
        // ?? (blom)

        // commit favicon, etc
        await $`npm run build-favicon`;

        // run api /tool/create-drizzle:
        await $`curl -X POST '${options?.siteUrl}/api/tool/create-drizzle'`;

        // commit database
        await $`npm run generate-db`;
        await $`npm run migrate-db`;
    }
    else if (action == 'server-install') {
        // install pre
        await $`sudo apt -y install nano curl wget ca-certificates fail2ban`;

        // create folder data
        await $`mkdir ${options?.homePath}/data`;

        // create folder config
        await $`mkdir ${options?.homePath}/config`;
        await $`sudo ln -s /etc/nginx/conf.d/ ${options?.homePath}/config/nginx-virtualhost`;
        await $`mkdir ${options?.homePath}/config/node`;

        // create folder log
        await $`mkdir ${options?.homePath}/log`;
        await $`sudo chmod 644 /var/log/nginx/.`;
        await $`sudo ln -s /var/log/nginx/ ${options?.homePath}/log/`;
        await $`mkdir ${options?.homePath}/log/node`;
        await $`sudo chmod 755 /var/log/postgresql`;
        await $`sudo chmod 644 /var/log/postgresql/.`;
        await $`sudo ln -s /var/log/postgresql/ ${options?.homePath}/log/`;

        // create folder backup
        await $`mkdir ${options?.homePath}/backup`;
        await $`mkdir ${options?.homePath}/backup/postgresql`;

        // prepare installation
        // - node 20, npm 9
        await $`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`;
        // - postgres 15
        await $`wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -`;
        await $`sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" >> /etc/apt/sources.list.d/pgdg.list'`;
        // - postgres 15 extension citus
        await $`curl https://install.citusdata.com/community/deb.sh | sudo bash`;
        // postgres 15 extension timescaledb
        await $`echo "deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main" | sudo tee /etc/apt/sources.list.d/timescaledb.list`;
        await $`wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -`;
        // update apt
        await $`sudo apt -y update`;

        // install
        // - nginx 1.18.0
        await $`sudo apt -y install nginx certbot python3-certbot-nginx`;
        // - node 20, npm 9
        await $`sudo apt-get -y install nodejs`;
        await $`sudo apt -y install build-essential`;
        await $`sudo npm install pm2 -g`;
        await $`sudo npm install zx -g`;
        // - postgres 15 & extension
        await $`sudo apt -y install postgresql-15`;
        await $`sudo apt -y install postgresql-15-postgis-3 postgresql-15-pgrouting postgresql-15-pgvector postgresql-15-age timescaledb-2-postgresql-15`;
        await $`sudo apt-get -y install postgresql-15-citus-11.3`;

        // configure
        // - nginx
        fs.writeFileSync('/etc/nginx/nginx.conf', `
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
}

http {
    # Basic
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 45;
    types_hash_max_size 2048;
    server_tokens off;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Buffer Size
    client_body_buffer_size 10K;
    client_max_body_size 8m;
    large_client_header_buffers 4 32k;
    fastcgi_buffers 16 32k;
    fastcgi_buffer_size 64k;
    fastcgi_busy_buffers_size 64k;

    # Timeout
    client_header_timeout 12;
    client_body_timeout 12;
    send_timeout 10;

    # Security
    # ssl_protocols TLSv1.2 TLSv1.3;

    # Compression
    gzip on;
    gzip_min_length 10240;
    gzip_disable "msie6";
    gzip_comp_level 2;
    gzip_types application/x-javascript text/css application/javascript text/javascript text/plain text/xml application/json application/vnd.ms-fontobject application/x-font-opentype application/x-font-truetype application/x-font-ttf application/xml font/eot font/opentype font/otf image/svg+xml image/vnd.microsoft.icon;
    # gzip_vary on;

    # Virtual Host
    include /etc/nginx/conf.d/*.conf;
}`);
        fs.writeFileSync('/etc/nginx/conf.d/default.conf', `
server {
    root ${options?.homePath}/data/default;
    index index.html;

    server_name localhost;

    access_log ${options?.homePath}/log/nginx/default_access.log;
    error_log ${options?.homePath}/log/nginx/default_error.log;

    listen 80 default_server;
    listen [::]:80;
}`);
        // - node
        fs.writeFileSync(options?.homePath + '/config/node/ecosystem.json', JSON.stringify({
            apps: [],
        }));
        await $`pm2 start ${options?.homePath}/config/node/ecosystem.json`;
        // - postgres
        await $`psql -d "${options?.databaseRootUrl}" -c "CREATE ROLE ${options?.databaseUsername} CREATEDB LOGIN PASSWORD '${options?.databasePassword}'"`;
        await $`psql -d "${options?.databaseRootUrl}" -c "ALTER USER postgres PASSWORD '${options?.databaseRootPassword}'"`;
        // - postgres: modified config
        changeConfig('/etc/postgresql/15/main/postgresql.conf', 'listen_addresses', '\'*\'');
        changeConfig('/etc/postgresql/15/main/postgresql.conf', 'timezone', '\'UTC\'');
        changeConfig('/etc/postgresql/15/main/postgresql.conf', 'shared_preload_libraries', '\'citus\'');
        await $`echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/15/main/pg_hba.conf`;
        await $`sudo timescaledb-tune`;

        // restart
        await $`sudo systemctl restart nginx`;
        await $`sudo systemctl restart postgresql`;
    }
    else if (action == 'server-config') {
        // add nginx virtual host
        fs.appendFileSync('/etc/nginx/conf.d/akira.conf', `

server {
    server_name ${options?.projectDomain};
    root ${options?.homePath}/data/${options?.projectName};
    index index.html;

    location /  {
        proxy_pass http://localhost:${options?.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    access_log ${options?.homePath}/log/nginx/${options?.projectName}_access.log;
    error_log ${options?.homePath}/log/nginx/${options?.projectName}_error.log;

    listen 80;
    listen [::]:80;
}

server {
    server_name ${options?.developmentProjectDomain};
    root /home/muliawan/data/${options?.developmentProjectName};
    index index.html;

    location /  {
        proxy_pass http://localhost:${options?.developmentPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    access_log ${options?.homePath}/log/nginx/${options?.developmentProjectName}_access.log;
    error_log ${options?.homePath}/log/nginx/${options?.developmentProjectName}_error.log;

    listen 80;
    listen [::]:80;
}`);

        // add ssl
        await $`sudo certbot --nginx -d ${options?.projectDomain} -d ${options?.developmentProjectDomain}`;

        // modified ecosystem.json (node)
        const ecosystemJson = fs.readJsonSync(options?.homePath + '/config/node/ecosystem.json');
        fs.writeFileSync(options?.homePath + '/config/node/ecosystem.json', JSON.stringify({
            apps: [
                ...ecosystemJson?.apps?.filter(x => ![options?.projectName, options?.developmentProjectName].includes(x.name)),
                {
                    name: options?.projectName,
                    cwd: options?.homePath + '/data/' + options?.projectName,
                    script: 'npm run start',
                    args: '-- -p ' + options?.port,
                    exec_mode: 'cluster',
                    watch: false,
                    max_memory_restart: '1G',
                    out_file: homePath + '/log/node/' + options?.projectName + '-out.log',
                    error_file: homePath + '/log/node/' + options?.projectName + '-error.log',
                    log_date_format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
                    autorestart: true,
                    max_restarts: 10,
                    restart_delay: 100,
                },
                {
                    name: options?.developmentProjectName,
                    cwd: options?.homePath + '/data/' + options?.projectName,
                    script: 'npm run dev',
                    args: '-- -p ' + options?.developmentPort,
                    exec_mode: 'fork',
                    watch: false,
                    max_memory_restart: '2G',
                    out_file: homePath + '/log/node/' + options?.developmentProjectName + '-out.log',
                    error_file: homePath + '/log/node/' + options?.developmentProjectName + '-error.log',
                    log_date_format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
                    autorestart: true,
                    max_restarts: 5,
                    restart_delay: 500,
                },
            ],
        }));
        await $`pm2 reload ${options?.homePath}/config/node/ecosystem.json`;

        // add postgres database + extension
        await $`psql -d "${options?.databaseUrl}" -c "CREATE DATABASE ${options?.projectName} WITH OWNER = ${options?.databaseUsername} ENCODING = 'UTF8'"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS ltree CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pgrouting CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS vector CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS age CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS citus CASCADE"`;
        await $`psql -d "${options?.databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE"`;

        // restart
        await $`sudo systemctl restart nginx`;
    }

    // delete temporary folder .akira
    if (action == 'install' || action == 'update') {
        await $`rm -rf ./akira`;
    }

    // install npm
    if (action == 'install' || action == 'update') {
        await $`npm install`;
    }

    // finish
    console.log(chalk.green.bold('Successfully ' + action + '.'));
}
catch (err) {
    console.log(chalk.red.bold(err.message));
}