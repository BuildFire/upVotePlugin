const UserModal = {
  userData: {},
  subtitle: "",
  item: null,
  personalDirectoryRequest: null,
  toggleEmptyState() { },

  initModalHeader() {
    return `
        <div style="display: flex; align-items: center;">
            <div class="avatar">
                <img src="${this.userData.image}" alt="${this.userData.displayName ? this.userData.displayName : state.strings['mainScreen.unknownUser']}"/>
            </div>

            <div class="user-info-holder ellipsis">
                <span class="user-title titleBarTextAndIcons ellipsis userNameTitle">${this.userData.displayName ? this.userData.displayName : state.strings['mainScreen.unknownUser']}</span></br>
                <span class="user-subtitle ellipsis">${this.subtitle}</span>
            </div>
        </div>
        `;
  },

  initModalTabs() {
    let badgesContent = `<div style="justify-content: center; text-transform: capitalize; text-align: center; font-size: 14px; padding: 24px; opacity: .7; min-height: 80px; display: flex; align-items:center;">
                        <span>${state.strings['mainScreen.noBadgesYet']}</span></div>`

    if (this.userData.badges && this.userData.badges.length) {
      badgesContent = `
                  <div style="word-break: normal !important; grid-template-columns: repeat(4, 1fr); display: grid; grid-column-gap: .75rem; grid-row-gap: 1.5rem; padding: 1rem .5rem; padding-bottom: calc(1rem + env(safe-area-inset-bottom));">
                      ${this.userData.badges.map((badge) => `<div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                                        <div style="border-radius: .25rem; width: 4rem; height: 4rem; position: relative;">
                                            <img style="border-radius: .25rem; width: 4rem; height: 4rem; object-fit: cover; overflow: hidden;" src="${badge.imageUrl}" alt="">
                                        </div>
                                        <h5 style="margin: .75rem 0 .125rem 0; font-weight: bold; word-break: break;">${badge.name}</h5>
                                       </div>`).join(' ')}
                  </div>`
    }

    const badgesTab = {
      text: `<span class="glyphicon glyphicon-tags"></span>`,
      content: badgesContent,
    }
    const userActionTab = {
      text: `<span class="glyphicon glyphicon-user"></span>`,
      listItems: [],
    }

    if (authManager.currentUser && this.userData.userId === authManager.currentUser._id) {
      userActionTab.listItems = [
        {
          id: 'openProfile',
          icon: 'glyphicon glyphicon-circle-arrow-right',
          text: state.strings['mainScreen.openProfile'],
        },
      ];
    } else {
      userActionTab.listItems = [
        {
          id: 'viewProfile',
          icon: 'glyphicon glyphicon-warning-sign',
          text: state.strings['mainScreen.viewProfile'],
        }
      ];
      if (state.settings.messagingFeatureInstance && state.settings.messagingFeatureInstance.instanceId) {
        userActionTab.listItems.unshift({
          id: 'messageUser',
          icon: 'glyphicon glyphicon-circle-arrow-right',
          text: state.settings.actionItem ? state.settings.actionItem.title : state.strings['mainScreen.messageUser'],
        })
      }
    }

    if (state.settings.enableDirectoryBadges) {
      return [userActionTab, badgesTab];
    } else {
      return [userActionTab];
    }
  },

  handleModalSelection(error, result) {
    buildfire.components.drawer.closeDrawer();
    if (error) {
      buildfire.components.toast.showToastMessage({
        type: 'danger',
        text: state.strings['mainScreen.somethingWentWrong'],
      });
      return console.error(error);
    }

    switch (result.id) {
      case 'openProfile':
        buildfire.auth.openProfile();
        break;
      case 'viewProfile':
        buildfire.auth.openProfile(this.userData.userId);
        break;
      case 'messageUser':
        const actionItem = state.settings.messagingFeatureInstance;
        const userIds = [this.userData.userId, authManager.currentUser._id];
        userIds.sort();

        const wTitle = `${this.userData.displayName ? this.userData.displayName : state.strings['mainScreen.unknownUser']} | ${authManager.currentUser.displayName ? authManager.currentUser.displayName : state.strings['mainScreen.unknownUser']}`;
        const wid = userIds[0] + userIds[1];
        const queryString = widgetUtils.prepareDeeplinkQueryStringData({ wid, wTitle, userIds });

        actionItem.queryString = queryString;

        buildfire.navigation.navigateTo(actionItem, console.log);
        break;
      default:
        break;
    }
  },

  init(userData, toggleEmptyState) {
    buildfire.spinner.show();
    this.userData = userData;
    this.personalDirectoryRequest = null;
    if (toggleEmptyState) {
      this.toggleEmptyState = toggleEmptyState;
    }

    const userImage = buildfire.auth.getUserPictureUrl({ userId: userData._id || userData.userId });
    const croppedUserImage = buildfire.imageLib.cropImage(userImage, { size: 'm', aspect: '1:1' });
    this.userData.image = croppedUserImage;

    const userBadgesIds = this.userData.badges ? this.userData.badges.map(badge => badge.id) : [];
    UserDirectory.getUserBadges(userBadgesIds).then((userBadges) => {
      this.userData.badges = userBadges.map(badge => {
        return { ...badge, imageUrl: buildfire.imageLib.cropImage(badge.imageUrl, { size: 's', aspect: '1:1' }) };
      });

      const header = this.initModalHeader();
      const tabs = this.initModalTabs();

      buildfire.spinner.hide();
      buildfire.components.drawer.openBottomDrawer({ header, tabs, enableFilter: false }, this.handleModalSelection.bind(this));
    })

  },
}
