#!/usr/bin/env node
import 'dotenv/config';
import 'zx/globals';
import * as semver from 'semver';
import { select, input, confirm } from '@inquirer/prompts';
$.verbose = false;

// run this sequentially: test, server-install, install, commit-dna, server-config; then commit-dna, update, ...
// run 'commit-dna' when there is change in: ./public/logo.png, ./public/logoWithText.png, ./dna/structure.js, or when just after install
// no need to run 'commit-dna' when there is change in: ./dna/theme.js, ./dna/*.theme.template.js
// file generate automatically by 'commit-dna'
// - ./db/*.*
// - ./dna/defaultSession.ts
// - ./dna/localeFormat.ts
// - ./dna/faviconData.json
// - ./dna/faviconDescription.json
// - ./public/*.png except ./public/logo.png and ./public/logoWithText.png
// - ./public/*.svg
// - ./public/favicon.ico
// - ./public/browserconfig.xml
// - ./public/site.webmanifest

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
// add to package.json:
// "script" : {
// "generate-db": "drizzle-kit generate",
// "migrate-db": "drizzle-kit migrate"
// }

const siteUrl = process?.env?.SITE_URL;
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
    const [action, testA, testB] = process.argv.slice(2);
    if (!action) {
        throw new Error('Please add action for this cli (install / update / commit-dna / test / server-install / server-config), example: "npx akira-cli update"');
    }

    // console.log('files', files);
    // console.log('filesCreateOnly', filesCreateOnly);
    // throw new Error('exit');

    // get options
    const options = process.execArgv?.reduce((xAcc, x) => {
        if (x?.startsWith('--github-pa-token=') && ['install', 'update'].includes(action)) {
            const [notUsed, githubPersonalAccessToken] = x?.split('=');
            return {
                ...xAcc,
                githubPersonalAccessToken: githubPersonalAccessToken,
            };
        }
        else if (x?.startsWith('--project-name=') && ['install'].includes(action)) {
            const [notUsed, projectName] = x?.split('=');
            return {
                ...xAcc,
                projectName: projectName,
            };
        }
        else if (x?.startsWith('--project-author=') && ['install'].includes(action)) {
            const [notUsed, projectAuthor] = x?.split('=');
            return {
                ...xAcc,
                projectAuthor: projectAuthor,
            };
        }
        else if (x?.startsWith('--template=') && ['install'].includes(action)) {
            const [notUsed, template] = x?.split('=');
            return {
                ...xAcc,
                template: template,
            };
        }
        else {
            return xAcc;
        }
    }, {});

    // check requirement
    if (action == 'install') {
        // at this state, server must be installed all requirement
        // check node and npm version
        const requirementNode = '>=20.0.0';
        const requirementNpm = '>=10.0.0';
        const currentNodeT = await $`node -v`;
        const currentNpmT = await $`npm -v`;
        const currentNode = currentNodeT?.stdout?.trim();
        const currentNpm = currentNpmT?.stdout?.trim();
        let requirementNotMeetError = '';
        if (!semver.satisfies(currentNode, requirementNode)) {
            requirementNotMeetError = requirementNotMeetError + 'Node version must be ' + requirementNode + '. ';
        }
        if (!semver.satisfies(currentNpm, requirementNpm)) {
            requirementNotMeetError = requirementNotMeetError + 'NPM version must be ' + requirementNode + '.';
        }
        if (requirementNotMeetError) {
            throw new Error(requirementNotMeetError);
        }
    }

    // make sure there is GitHub PA Token for repository 'akira'
    if (action == 'install' || action == 'update') {
        if (!options?.githubPersonalAccessToken) {
            options.githubPersonalAccessToken = await input({
                message: 'Github PA Token for repository "muliawanoetama/' + sourceRepository + '.git" ?',
                default: '',
            });
        }
        if (!options?.githubPersonalAccessToken) {
            throw new Error('You must provide Github PA Token for repository "muliawanoetama/' + sourceRepository + '.git".');
        }
    }

    // make sure all required options filled
    if (action == 'install') {
        if (!options?.projectName) {
            options.projectName = await input({
                message: 'Name of your project (use lowercase) ?',
                default: '',
            }) ?? 'no-project-name';
        }
        if (!options?.projectAuthor) {
            options.projectAuthor = await input({
                message: 'What is your name ?',
                default: '',
            }) ?? '';
        }
        if (!options?.template) {
            options.template = await select({
                message: 'Choose template for this project:',
                choices: Object.entries(templateList)?.map(([k, v]) => ({
                    value: k,
                    name: v,
                })),
            }) ?? 'custom';
        }
    }
    else if (action == 'update') {
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
        // get overwrite confirmation
        const overwriteConfirmation = await confirm({
            message: 'Please make sure you have added first line prefix "// modified" to each file that you change manually. This will prevent those files from being overwritten. Can you confirm this?',
            default: false,
        });
        if (!overwriteConfirmation) {
            throw new Error('You must add first line prefix "// modified" to each file that you change manually.');
        }
    }

    // copy muliawanoetama/akira.git to temporary folder ./.akira/
    if (action == 'install' || action == 'update') {
        await $`rm -rf ./akira/`;
        await $`mkdir .akira`;
        await $`git clone https://${options?.githubPersonalAccessToken}@github.com/muliawanoetama/${sourceRepository}.git ./.akira/`;
    }

    // main
    if (action == 'test') {
        console.log('Test: ' + testA + ' x ' + testB + ' = ', (testA ?? 0) + (testB ?? 0));
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
            console.log('- copy overwrite file', src, dest);
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
        await $`curl -X POST '${siteUrl}/api/tool/create-drizzle'`;

        // commit database
        await $`npm run generate-db`;
        await $`npm run migrate-db`;
    }
    else if (action == 'server-install') {
        const homePath = '/home/muliawan';

        // requirement Ubuntu 20.04

        // create folder data
        await $`mkdir ${homePath}/data`;

        // create folder config
        await $`mkdir ${homePath}/config`;
        await $`sudo ln -s /etc/nginx/conf.d/ ${homePath}/config/nginx-virtualhost`;
        await $`mkdir ${homePath}/config/node`;

        // create folder log
        await $`mkdir ${homePath}/log`;
        await $`sudo chmod 644 /var/log/nginx/.`;
        await $`sudo ln -s /var/log/nginx/ ${homePath}/log/`;
        await $`mkdir ${homePath}/log/node`;
        await $`sudo chmod 755 /var/log/postgresql`;
        await $`sudo chmod 644 /var/log/postgresql/.`;
        await $`sudo ln -s /var/log/postgresql/ ${homePath}/log/`;

        // create folder backup
        await $`mkdir ${homePath}/backup`;
        await $`mkdir ${homePath}/backup/postgresql`;

        // prepare installation
        // - node 20, npm 9
        await $`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`;
        // - postgres 15
        await $`sudo apt -y install wget ca-certificates`;
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
        // - standard
        await $`sudo apt -y install nano fail2ban`;
        // - nginx 1.18.0
        await $`sudo apt -y install nginx certbot python3-certbot-nginx`;
        // node 20, npm 9
        await $`sudo apt-get -y install nodejs`;
        await $`sudo apt -y install build-essential`;
        await $`sudo npm install pm2 -g`;
        // install postgres 15 & extension
        await $`sudo apt -y install postgresql-15`;
        await $`sudo apt -y install postgresql-15-postgis-3 postgresql-15-pgrouting postgresql-15-pgvector postgresql-15-age timescaledb-2-postgresql-15`;
        await $`sudo apt-get -y install postgresql-15-citus-11.3`;

        // configure
        const databaseUrl = '';
        // - nginx
        fs.writeFileSync('/etc/nginx/conf.d/default.conf', `
server {
    root ${homePath}/data/default;
    index index.html;

    server_name localhost;

    access_log ${homePath}/log/nginx/default_access.log;
    error_log ${homePath}/log/nginx/default_error.log;

    listen 80 default_server;
    listen [::]:80;
}`);
        // - postgres
        // sudo -u postgres psql
        // postgres=# \password postgres
        // postgres=# CREATE ROLE muliawan CREATEDB LOGIN PASSWORD 'm***1***';
        // postgres=# CREATE DATABASE akira WITH OWNER = muliawan ENCODING = 'UTF8';
        // postgres=# \q

        // echo "shared_preload_libraries = 'citus'" >> citus/postgresql.conf
        // in /etc/postgresql/15/main/postgresql.conf, make postgresql can be accessed from everywhere
        // listen_addresses = '*'
        // timezone = 'UTC'
        // in /etc/postgresql/15/main/pg_hba.conf, make postgresql can be accessed from everywhere, add in bottom
        // host all all 0.0.0.0/0 md5

        await $`sudo timescaledb-tune`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS ltree CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS pgrouting CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS vector CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS age CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS citus CASCADE"`;
        await $`psql -d "${databaseUrl}" -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE"`;

        // restart
        await $`sudo systemctl restart nginx`;
        await $`sudo systemctl restart postgresql`;
    }
    else if (action == 'server-config') {
        const homePath = '/home/muliawan';
        const siteName = 'test';
        const siteDomain = 'test.muliawanoetama.com';
        const port = 3000;
        const developmentPort = 53000;

        // add nginx virtual host
        fs.appendFileSync('/etc/nginx/conf.d/akira.conf', `

server {
    server_name ${siteDomain};
    root /home/muliawan/data/${siteName};
    index index.html;

    location /  {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    access_log ${homePath}/log/nginx/${siteName}_access.log;
    error_log ${homePath}/log/nginx/${siteName}_error.log;

    listen 80;
    listen [::]:80;
}`);

        // add ssl
        await $`sudo certbot --nginx`;

        // add nodejs configuration
        const nodeConfig =
        // module.exports = {
        //     apps: [
        //         {
        //             name: 'test-dev',
        //             cwd: '/home/muliawan/data/test', // working directory
        //             script: 'npm run dev',
        //             args: '', // arguments to pass to the script
        //             exec_mode: 'fork', // 'fork' (default) / 'cluster'; cluster mode allows networked Node.js applications (http(s)/tcp/udp server) to be scaled across all CPUs available, greatly increases performance and reliability depending on the number of CPUs available
        //             watch: false, // if true, when a file change in the folder / subfolder, process will reload
        //             max_memory_restart: '1G', // process will be restarted if it exceeds the amount of memory specified, end with G for GB
        //             out_file: '/home/muliawan/log/node/test-dev-out.log', // output log file path
        //             error_file: '/home/muliawan/log/node/test-dev-error.log', // error log file path
        //             log_date_format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
        //             autorestart: true, // if false, process will not restart when crashed or end peacefully
        //             max_restarts: 10, // number of consecutive unstable restarts (less than 1sec interval ) before process is considered errored and stop being restarted
        //             restart_delay: 100, // time to wait before restart (in milliseconds)
        //         },
        //     ]
        // };
        await $`pm2 start ${homePath}/config/node/ecosystem.config.js`;
    }

    // delete temporary folder .akira
    if (action == 'install' || action == 'update') {
        await $`rm -rf ./akira/`;
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