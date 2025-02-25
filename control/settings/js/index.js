const settingsPage = {
  saveTimer: null,
  hideCompletedItemsList: [
    { text: 'Immediately', value: 0 },
    { text: '1 day (24 hours)', value: 1 },
    { text: '3 days', value: 3 },
    { text: '5 days', value: 5 },
    { text: '7 days', value: 7 },
    { text: '10 days', value: 10 },
    { text: '15 days', value: 15 },
    { text: '30 days', value: 30 },
    { text: '60 days', value: 60 },
    { text: '90 days', value: 90 },
    { text: 'Never', value: -1 },
  ],

  selectors: {},

  initSelectors() {
    this.selectors = {
      directoryBadgesRow: document.getElementById('directoryBadgesRow'),
      chatMessagingRow: document.getElementById('chatMessagingRow'),

      // toggles
      enableComments: document.getElementById('enableComments'),
      enableUserProfile: document.getElementById('enableUserProfile'),
      enableDirectoryBadges: document.getElementById('enableDirectoryBadges'),
      addChatInstance: document.getElementById('addChatInstance'),
      chatInstanceRowContainer: document.getElementById('chatInstanceRowContainer'),
      editChatInstance: document.getElementById('editChatInstance'),
      deleteChatInstance: document.getElementById('deleteChatInstance'),
      chatInstanceIcon: document.getElementById('chatInstanceIcon'),
      chatInstanceTitle: document.getElementById('chatInstanceTitle'),

      // radios
      postCreationAllUsers: document.getElementById('postCreationAllUsers'),
      postCreationNoUsers: document.getElementById('postCreationNoUsers'),
      postCreationUsersWith: document.getElementById('postCreationUsersWith'),
      statusUpdateAllUsers: document.getElementById('statusUpdateAllUsers'),
      statusUpdateNoUsers: document.getElementById('statusUpdateNoUsers'),
      statusUpdateUsersWith: document.getElementById('statusUpdateUsersWith'),
      pushNotificationAllUsers: document.getElementById('pushNotificationAllUsers'),
      pushNotificationNoUsers: document.getElementById('pushNotificationNoUsers'),
      pushNotificationUsersWith: document.getElementById('pushNotificationUsersWith'),
      newestSorting: document.getElementById('newestSorting'),
      oldestSorting: document.getElementById('oldestSorting'),
      mostVotesSorting: document.getElementById('mostVotesSorting'),

      // tags containers
      postCreationTagsInput: document.getElementById('postCreationTagsInput'),
      statusUpdateUserTags: document.getElementById('statusUpdateUserTags'),
      pushNotificationUserTags: document.getElementById('pushNotificationUserTags'),

      // inputs
      votesNumberContainer: document.getElementById('votesNumberContainer'),
      votesNumberInput: document.getElementById('votesNumberInput'),
      votesNumberErrorMessage: document.getElementById('votesNumberErrorMessage'),
    };
  },

  initListeners() {
    this.selectors.addChatInstance.onclick = this.addEditChatInstance.bind(this);
    this.selectors.editChatInstance.onclick = this.addEditChatInstance.bind(this);
    this.selectors.deleteChatInstance.onclick = () => {
      state.settings.messagingFeatureInstance = {};
      this.saveWithDelay();
    }

    this.selectors.enableComments.onchange = (event) => {
      state.settings.enableComments = event.target.checked;
      this.saveWithDelay();
    };
    this.selectors.enableUserProfile.onchange = (event) => {
      state.settings.enableUserProfile = event.target.checked;
      this.saveWithDelay();
    };
    this.selectors.enableDirectoryBadges.onchange = (event) => {
      state.settings.enableDirectoryBadges = event.target.checked;
      this.saveWithDelay();
    };

    [
      this.selectors.postCreationAllUsers,
      this.selectors.postCreationNoUsers,
      this.selectors.postCreationUsersWith,
      this.selectors.statusUpdateAllUsers,
      this.selectors.statusUpdateNoUsers,
      this.selectors.statusUpdateUsersWith,
      this.selectors.pushNotificationAllUsers,
      this.selectors.pushNotificationNoUsers,
      this.selectors.pushNotificationUsersWith
    ].forEach((permissionRadio) => {
      permissionRadio.onchange = (event) => {
        state.settings.permissions[event.target.name].value = event.target.value;
        this.updateUI();
        this.saveWithDelay();
      };
    });

    [
      this.selectors.newestSorting,
      this.selectors.oldestSorting,
      this.selectors.mostVotesSorting,
    ].forEach((sortRadio) => {
      sortRadio.onchange = (event) => {
        state.settings.defaultItemSorting = event.target.value;
        this.updateUI();
        this.saveWithDelay();
      }
    });

    this.selectors.votesNumberInput.oninput = (event) => {
      if (!event.target.value || Number(event.target.value) < 1) {
        this.selectors.votesNumberInput.classList.add('border-danger');
        this.selectors.votesNumberErrorMessage.classList.remove('hidden');
      } else {
        this.selectors.votesNumberErrorMessage.classList.add('hidden');
        this.selectors.votesNumberInput.classList.remove('border-danger');
        state.settings.inAppPurchase.votesPerPurchase = parseInt(event.target.value);
        this.saveWithDelay();
      }
    }
  },

  addEditChatInstance() {

    buildfire.pluginInstance.showDialog({}, (error, instances) => {
      if (!error && instances.length > 0) {
        state.settings.messagingFeatureInstance = instances[0];
        this.saveWithDelay();
      } else if (error) {
        console.error(error);
        buildfire.dialog.toast({
          message: "Something went wrong.",
          type: 'danger',
        });
      }
    });
  },

  getDeepSettingValue(settingKey) {
    const keys = settingKey.split('.');
    let settingValue = state.settings;
    for (let key of keys) {
      if (settingValue[key] !== undefined) {
        settingValue = settingValue[key];
      } else {
        break;
      }
    }
    return settingValue;
  },
  updateDeepSettingValue(settingKey, value) {
    const keys = settingKey.split('.');
    let current = state.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current = current[key];
    }

    const isEquals = utils.checkEquality(current[keys[keys.length - 1]], value);
    if (!isEquals) {
      current[keys[keys.length - 1]] = value;
      this.saveWithDelay();
    }
  },

  initTagsInput(options) {
    const { settingKey, selector } = options;
    const settingValue = this.getDeepSettingValue(settingKey);

    const tagsInput = new buildfire.components.control.userTagsInput(selector, {
      languageSettings: {
        placeholder: 'User Tags',
      },
    });

    tagsInput.onUpdate = (data) => {
      const updatedTags = data.tags.map((tag) => ({
        tagName: tag.tagName,
        value: tag.value,
      }));
      this.updateDeepSettingValue(`${settingKey}.tags`, updatedTags);
    };
    tagsInput.set(settingValue.tags);
  },

  initDropdown(options) {
    const dropdownContainer = document.querySelector(options.selector);
    const dropdownButton = dropdownContainer.querySelector('button');
    const buttonLabel = dropdownButton.querySelector('.button-label');
    const dropdownList = dropdownContainer.querySelector('ul');

    const value = this.getDeepSettingValue(options.settingKey);
    const selectedItem = options.items.find((item) => item.value === value);
    buttonLabel.textContent = selectedItem ? selectedItem.text : options.items[0].text;

    dropdownButton.onclick = () => {
      dropdownContainer.classList.toggle('open');
    }

    dropdownList.innerHTML = ''; // clear the list before adding items
    options.items.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `<a>${item.text}</a>`;
      listItem.onclick = () => {
        buttonLabel.textContent = item.text;
        dropdownContainer.classList.remove('open');
        this.updateDeepSettingValue(options.settingKey, item.value);
      }
      dropdownList.appendChild(listItem);
    });
  },

  updateUI() {
    const settings = state.settings;
    const selectors = this.selectors;

    // update toggles
    selectors.enableComments.checked = settings.enableComments;
    selectors.enableDirectoryBadges.checked = settings.enableDirectoryBadges;
    selectors.enableUserProfile.checked = settings.enableUserProfile;

    // update radios
    selectors.postCreationAllUsers.checked = settings.permissions.createPosts.value === ENUMS.USERS_PERMISSIONS.ALL_USERS;
    selectors.postCreationNoUsers.checked = settings.permissions.createPosts.value === ENUMS.USERS_PERMISSIONS.NO_USERS;
    selectors.postCreationUsersWith.checked = settings.permissions.createPosts.value === ENUMS.USERS_PERMISSIONS.USERS_WITH;

    selectors.statusUpdateAllUsers.checked = settings.permissions.updateStatus.value === ENUMS.USERS_PERMISSIONS.ALL_USERS;
    selectors.statusUpdateNoUsers.checked = settings.permissions.updateStatus.value === ENUMS.USERS_PERMISSIONS.NO_USERS;
    selectors.statusUpdateUsersWith.checked = settings.permissions.updateStatus.value === ENUMS.USERS_PERMISSIONS.USERS_WITH;

    selectors.pushNotificationAllUsers.checked = settings.permissions.receiveNotifications.value === ENUMS.USERS_PERMISSIONS.ALL_USERS;
    selectors.pushNotificationNoUsers.checked = settings.permissions.receiveNotifications.value === ENUMS.USERS_PERMISSIONS.NO_USERS;
    selectors.pushNotificationUsersWith.checked = settings.permissions.receiveNotifications.value === ENUMS.USERS_PERMISSIONS.USERS_WITH;

    selectors.newestSorting.checked = settings.defaultItemSorting === ENUMS.SUGGESTIONS_SORTING.NEWEST;
    selectors.oldestSorting.checked = settings.defaultItemSorting === ENUMS.SUGGESTIONS_SORTING.OLDEST;
    selectors.mostVotesSorting.checked = settings.defaultItemSorting === ENUMS.SUGGESTIONS_SORTING.MOST_VOTES;

    if (settings.permissions.createPosts.value === ENUMS.USERS_PERMISSIONS.USERS_WITH) {
      selectors.postCreationTagsInput.classList.remove('hidden');
    } else {
      selectors.postCreationTagsInput.classList.add('hidden');
    }
    if (settings.permissions.updateStatus.value === ENUMS.USERS_PERMISSIONS.USERS_WITH) {
      selectors.statusUpdateUserTags.classList.remove('hidden');
    } else {
      selectors.statusUpdateUserTags.classList.add('hidden');
    }
    if (settings.permissions.receiveNotifications.value === ENUMS.USERS_PERMISSIONS.USERS_WITH) {
      selectors.pushNotificationUserTags.classList.remove('hidden');
    } else {
      selectors.pushNotificationUserTags.classList.add('hidden');
    }

    if (settings.inAppPurchase.enabled && settings.inAppPurchase.planId) {
      selectors.votesNumberContainer.classList.remove('hidden');
    } else {
      selectors.votesNumberContainer.classList.add('hidden');
    }

    if (settings.messagingFeatureInstance && settings.messagingFeatureInstance.instanceId) {
      selectors.chatInstanceRowContainer.classList.remove('hidden');
      selectors.addChatInstance.classList.add('hidden');

      const croppedImage = buildfire.imageLib.cropImage(settings.messagingFeatureInstance.iconUrl, { size: "xs", aspect: "1:1" });
      selectors.chatInstanceIcon.src = croppedImage;
      selectors.chatInstanceTitle.textContent = settings.messagingFeatureInstance.title;
    } else {
      selectors.chatInstanceRowContainer.classList.add('hidden');
      selectors.addChatInstance.classList.remove('hidden');
    }

    if (settings.enableUserProfile) {
      selectors.directoryBadgesRow.classList.remove('hidden');
      selectors.chatMessagingRow.classList.remove('hidden');
    } else {
      selectors.directoryBadgesRow.classList.add('hidden');
      selectors.chatMessagingRow.classList.add('hidden');
    }
  },

  saveWithDelay() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      if (!state.settings.inAppPurchase.planId) {
        state.settings.inAppPurchase.enabled = false;
      } else {
        state.settings.inAppPurchase.enabled = true;
      }
      settingsController.saveSettings(state.settings);

      this.updateUI();
    }, 500);
  },

  init() {
    settingsController.getSettings()
      .then(() => {
        this.initSelectors();
        this.initListeners();

        this.initTagsInput({ selector: '#postCreationTagsInput', settingKey: 'permissions.createPosts' });
        this.initTagsInput({ selector: '#statusUpdateUserTags', settingKey: 'permissions.updateStatus' });
        this.initTagsInput({ selector: '#pushNotificationUserTags', settingKey: 'permissions.receiveNotifications' });

        this.initDropdown({ selector: '#hideCompletedDropdown', items: this.hideCompletedItemsList, settingKey: 'hideCompletedItems' });
        settingsController.getInAppPurchaseProducts().then((products) => {
          const items = [
            { value: '', text: 'Disabled' },
            ...products.map((product) => ({ value: product.id, text: product.name })),
          ];
          this.initDropdown({ selector: '#inAppPurchaseDropdown', items, settingKey: 'inAppPurchase.planId' });
        }).catch((err) => {
          console.error('Error fetching in-app purchase products:', err);
          this.initDropdown({ selector: '#inAppPurchaseDropdown', items: [{ value: '', text: 'Disabled' }], settingKey: 'inAppPurchase.planId' });
        });

        this.updateUI();
      });
  }
};

window.onload = () => {
  settingsPage.init();
}
