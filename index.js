#!/usr/bin/env node
import 'zx/globals';
import * as semver from 'semver';
import { select, input, confirm } from '@inquirer/prompts';
$.verbose = false;

const siteDomain = '';
const databaseUrl = '';

// check again:
// ./public/robots.txt
// ./public/site.webmanifest
// ./public/sitemap.xml
// delete ./script
// change drizzle.config.ts to:
// import { defineConfig } from 'drizzle-kit';
// export default defineConfig({
//     dialect: 'postgresql',
//     schema: './db/schema.ts',
//     out: './db/migrations',
//     dbCredentials: {
//         url: '',
//     },
// });
// add to package.json:
// "script" : {
// "generate-db": "drizzle-kit generate",
// "migrate-db": "drizzle-kit migrate"
// }

// generate automatically by this({ action: 'commit-dna' })
// ./db/*.*
// ./dna/defaultSession.ts
// ./dna/localeFormat.ts
// ./dna/faviconData.json
// ./dna/faviconDescription.json
// ./public/*.png except ./public/logo.png and ./public/logoWithText.png
// ./public/*.svg
// ./public/favicon.ico
// ./public/browserconfig.xml
// ./public/site.webmanifest

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
    'postcss.config.js': true,
    'tailwind.config.js': true,
    'jsconfig.json': true,
    'tsconfig.json': true,
    'next-env.d.ts': true,
    'drizzle.config.js': true,
    'vitest.config.ts': true,
    'next.config.js': true,
    'middleware.js': true,
    'dna/builtin.structure.template.js': true,
    'dna/theme.js': true,
    'dna/tailwindui.theme.template.js': true,
    'dna/radixui.theme.template.js': true,
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
    'dna/structure.js', // from 'dna/sample.structure.js'
    'public/logo.png',
    'public/logoWithText.png',
    'public/robots.txt',
    'public/sitemap.xml',
    'public/sample/*.*',
];
// CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
const postgresExtension = [
    'pg_stat_statements', // stat
    'pgcrypto', // crypto
    'pg_trgm', // text similarity
    'ltree', // hierarchy
    'postgis', // map: sudo apt install postgresql-15-postgis-3
    'pgrouting', // map++: sudo apt install postgresql-15-pgrouting
    'vector', // vector: sudo apt install postgresql-15-pgvector
    'age', // graph: sudo apt install postgresql-15-age
    'citus', // analytic: https://docs.citusdata.com/en/v11.3/installation/single_node_debian.html
    'timescaledb', // time analytic: https://docs.timescale.com/self-hosted/latest/install/installation-linux/
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
        throw new Error('Please add action for this cli (install / update / commit-dna / test), example: "npx akira-cli update"');
    }

    // console.log('files', files);
    // console.log('filesCreateOnly', filesCreateOnly);
    // throw new Error('exit');

    // get options
    const options = process.execArgv?.reduce((xAcc, x) => {
        if (x?.startsWith('--github-patoken=')) {
            const [notUsed, githubPersonalAccessToken] = x?.split('=');
            return {
                ...xAcc,
                githubPersonalAccessToken: githubPersonalAccessToken,
            };
        }
        else if (x?.startsWith('--project-name=')) {
            const [notUsed, projectName] = x?.split('=');
            return {
                ...xAcc,
                projectName: projectName,
            };
        }
        else if (x?.startsWith('--project-author=')) {
            const [notUsed, projectAuthor] = x?.split('=');
            return {
                ...xAcc,
                projectAuthor: projectAuthor,
            };
        }
        else if (x?.startsWith('--template=')) {
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

    // make sure there is GitHub PA Token for repository 'akira'
    if (action == 'install' || action == 'update') {
        if (!options?.githubPersonalAccessToken) {
            options.githubPersonalAccessToken = await input({
                message: 'Github PA Token for repository "muliawanoetama/' + sourceRepository + '.git" ?',
                default: '',
            });
        }
    }

    // initial action
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
            requirementNotMeetError = requirementNotMeetError + 'NPM version must be ' + requirementNode + '. ';
        }
        if (requirementNotMeetError) {
            throw new Error(requirementNotMeetError);
        }
        // asked empty options
        if (!options?.projectName) {
            options.projectName = await input({
                message: 'Name of your project (use lowercase)?',
                default: '',
            }) ?? 'no-project-name';
        }
        if (!options?.projectAuthor) {
            options.projectAuthor = await input({
                message: 'What is your name?',
                default: '',
            }) ?? '';
        }
        if (!options?.template) {
            options.template = await select({
                message: 'Choose template for this project??',
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
                throw new Error('To install new project, run "npx akira-cli install"');
            }
            else {
                throw new Error('Is this akira\'s based project? We can not find akira.json in this directory');
            }
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

        // create drizzle.config.js
        fs.writeFileSync('./drizzle.config.js', `
export default defineConfig({
    dialect: 'postgresql',
    schema: './db/schema.ts',
    out: './db/migrations',
    dbCredentials: {
        url: '',
    },
});`);

        // modified package.json
        const packageJson = fs.readJsonSync('./package.json');
        fs.writeFileSync('./package.json', JSON.stringify({
            ...packageJson,
            name: options?.projectName ?? 'no-project-name',
            author: options?.projectAuthor ?? '',
        }));

        // create .env
        fs.writeFileSync('./.env', `
SITE_PATH=
SITE_LOGPATH=
CDN_PATH=
CDN_PROVIDER=
DATABASE_URL,
AUTH_TIMEOUT=
AUTH_SERVICEPASSWORD=
AUTH_WEBHOOKPASSWORD=
ENCRYPT_KEY=
PRIVATEAPI_GOOGLECLIENTID=
PRIVATEAPI_GOOGLECLIENTSECRET=,
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

        //
        await $`curl -X POST '${siteDomain}/api/tool/create-drizzle'`;

        // commit database
        await $`npm run generate-db`;
        await $`npm run migrate-db`;
    }
    else if (action == 'update') {
        // get ./akira.json data into akiraConfig
        const akiraConfig = fs.readJsonSync('./akira.json');
        options.template = akiraConfig?.template;
        if (!options?.template) {
            options.template = 'custom';
        }
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
    }
    else if (action == 'commit-dna') {


        // run this when there is change in: ./public/logo.png, ./public/logoWithText.png, ./dna/structure.js
        // no need to run this where there is change in: ./dna/theme.js, ./dna/*.theme.template.js

        // automatically generate value for logoPrimaryColor in ./dna/*.theme.template.js

        // run api $DOMAIN_NAME/api/tool/create-drizzle that will generate:
        // -
        await $`curl -X POST '${siteDomain}/api/tool/create-drizzle'`;


        // commit database
        await $`npm run generate-db`;
        await $`npm run migrate-db`;

        // commit favicon, etc based on ./public/logo.png and ./public/logoWithText.png
        await $`npm run build-favicon`;
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