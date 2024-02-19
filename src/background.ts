const cwd = chrome.runtime.getURL('background.js').split('/').slice(0, -1).join('/');

importScripts(`${cwd}/libs/idb.umd.js`);

self.addEventListener('install', () => {
 importScripts(`${cwd}/libs/linkedom.js`);
 importScripts(`${cwd}/libs/evalCore.umd.js`);
});

type Job = {
 nextVote: number;
 url: string;
};

chrome.alarms.onAlarm.addListener(() => {
 checkStartVoting();
});

const checkStartVoting = () => {
 if (!localStorage.getItem('auto-vote-jobs')) localStorage.setItem('auto-vote-jobs', '[]');
 const jobs = JSON.parse(localStorage.getItem('auto-vote-jobs')!) as Job[];

 const now = Date.now();

 jobs.forEach((job) => {
  if (job.nextVote > now) {
   chrome.alarms.create(job.url, { when: job.nextVote });
   return;
  }

  startVote(job);
 });
};

let groupId: number | null = null;

const startVote = async (job: Job) => {
 const modulePath = chrome.runtime.getURL(`websites/${new URL(job.url).host}.js`);
 if (!modulePath) throw new Error(`Module not found "websites/${new URL(job.url).host}.js"`);

 const tab = await chrome.tabs.create({ url: job.url, active: true });

 if (groupId && await chrome.tabGroups.get(groupId)) {
  await chrome.tabs.group({ tabIds: tab.id, groupId });
 }
 groupId = await chrome.tabs.group({ tabIds: tab.id });
 chrome.tabGroups.query({ })

 importScripts(modulePath);
};

checkStartVoting();
