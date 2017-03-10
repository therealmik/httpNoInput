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
}


/**
 * Handles the pageAction onClicked event.
 *
 * @param {!Tab} tab The tab that the pageAction was clicked from.
 */
function onPageActionClicked(tab) {
  if (!tab.url) {
    console.log('No url parameter in Tab object');
    return;
  }

  let url = tab.url.replace(/^http:/, 'https:');
  chrome.tabs.update(tab.id, {url: url});
}


if (chrome && chrome.runtime && chrome.runtime.id) {
  chrome.runtime.onInstalled.addListener(onInstalled);
  chrome.pageAction.onClicked.addListener(onPageActionClicked);
}
