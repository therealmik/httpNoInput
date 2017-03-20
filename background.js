const UPGRADE_ID = 'upgrade';
const REENABLE_ID = 'reenable';


/**
 * Handles installation and upgrade events.
 *
 * @param {!Object} details onInstalled details object.
 */
function onInstalled(details) {
  chrome.contentSettings.javascript.set({
    primaryPattern: 'http://*/*',
    secondaryPattern: 'http://*/*',
    setting: 'block',
  });

  chrome.contentSettings.plugins.set({
    primaryPattern: 'http://*/*',
    secondaryPattern: 'http://*/*',
    setting: 'block',
  });

  const pageActionRule = {
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { schemes: ['http'] },
      }),
    ],
    actions: [
      new chrome.declarativeContent.ShowPageAction(),
    ],
  };

  const scriptInjectRule = {
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { schemes: ['http', 'ftp'] },
        css: ['input'],
      }),
    ],
    actions: [
      new chrome.declarativeContent.RequestContentScript({
        js: ['disableInput.js'],
        allFrames: true,
      }),
    ],
  };

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([pageActionRule, scriptInjectRule]);
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: UPGRADE_ID,
      title: 'Upgrade to HTTPS',
      contexts: ['page', 'page_action'],
      documentUrlPatterns: [ 'http://*/*' ],
    });

    chrome.contextMenus.create({
      id: REENABLE_ID,
      title: 'Re-enable Inputs',
      contexts: ['page', 'page_action'],
      documentUrlPatterns: [ 'http://*/*' ],
    });
  });
}


/**
 * Upgrades the tab to https
 *
 * @param {!Tab} tab The tab that the pageAction was clicked from.
 */
function upgradeToHttps(tab) {
  if (!tab.url) {
    console.log('No url parameter in Tab object');
    return;
  }

  let url = tab.url.replace(/^http:/, 'https:');
  chrome.tabs.update(tab.id, { url: url });
}


/**
 * Re-enables input form fields on the page.
 *
 * @param {!Object} info Information about the click event.
 * @param {!Tab} tab The tab that the pageAction was clicked from.
 */
function reEnableInputs(tab) {
  chrome.tabs.executeScript(tab.id, { file: 'enableInput.js', allFrames: true });
}


/**
 * Handles the contextMenu onClicked event.
 *
 * @param {!Object} info Information about the click event.
 * @param {!Tab} tab The tab that the pageAction was clicked from.
 */
function onContextMenuClicked(info, tab) {
  switch (info.menuItemId) {
    case UPGRADE_ID:
      upgradeToHttps(tab);
      break;
    case REENABLE_ID:
      reEnableInputs(tab);
      break;
  }
}


if (chrome && chrome.runtime && chrome.runtime.id) {
  chrome.runtime.onInstalled.addListener(onInstalled);
  chrome.contextMenus.onClicked.addListener(onContextMenuClicked);
  chrome.pageAction.onClicked.addListener(upgradeToHttps);
}
