const UserModal = {
  appTheme: buildfire.getContext().appTheme,
  userData: {},
  subtitle: '',
  item: null,
  personalDirectoryRequest: null,
  toggleEmptyState() { },

  initModalHeader() {
    const userName = widgetUtils.getUserName(this.userData);
    return `
        <div style="display: flex; align-items: center;">
            <div class="avatar">
                <img src="${this.userData.image}" alt="${userName}"/>
            </div>

            <div class="user-info-holder ellipsis">
                <span class="user-title titleBarTextAndIcons ellipsis userNameTitle">${userName}</span></br>
                <span class="user-subtitle ellipsis">${this.subtitle}</span>
            </div>
        </div>
        `;
  },

  initModalTabs() {
    let badgesContent;

    if (this.userData.badges && this.userData.badges.length) {
      badgesContent = `
                  <div style="word-break: normal !important; grid-template-columns: repeat(4, 1fr); display: grid; grid-column-gap: .75rem; grid-row-gap: 1.5rem; padding: 1rem .5rem; padding-bottom: calc(1rem + env(safe-area-inset-bottom));">
                      ${this.userData.badges.map((badge) => `<div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                                        <div style="border-radius: .25rem; width: 4rem; height: 4rem; position: relative;">
                                            <img style="border-radius: .25rem; width: 4rem; height: 4rem; object-fit: cover; overflow: hidden;" src="${badge.imageUrl}" alt="">
                                        </div>
                                        <h5 style="margin: .75rem 0 .125rem 0; font-weight: bold; word-break: break;">${badge.name}</h5>
                                       </div>`).join(' ')}
                  </div>`;
    } else {
      const emptyContainer = document.createElement('div');
      emptyContainer.style.display = 'flex';
      emptyContainer.style.justifyContent = 'center';
      emptyContainer.style.textTransform = 'capitalize';
      emptyContainer.style.flexDirection = 'column';
      emptyContainer.style.textAlign = 'center';
      emptyContainer.style.fontSize = '14px';
      emptyContainer.style.padding = '24px';
      emptyContainer.style.opacity = '0.7';
      emptyContainer.style.minHeight = '80px';
      emptyContainer.style.alignItems = 'center';

      const emptySvg = document.createElement('img');
      emptySvg.src = 'https://pluginserver.buildfire.com/styles/media/empty.svg';
      emptySvg.style.width = '60px';
      emptySvg.style.marginBottom = '10px';

      const emptyTextContainer = document.createElement('span');
      emptyTextContainer.style.color = this.appTheme.colors.bodyText;
      emptyTextContainer.innerHTML = state.strings['mainScreen.noBadgesYet'];

      emptyContainer.appendChild(emptySvg);
      emptyContainer.appendChild(emptyTextContainer);

      badgesContent = emptyContainer.outerHTML;
    }

    const badgesTab = {
      text: '<span class="glyphicon glyphicon-tags"></span>',
      content: badgesContent,
    };
    const userActionTab = {
      text: '<span class="glyphicon glyphicon-user"></span>',
      listItems: [],
    };

    if (authManager.currentUser && this.userData.userId === authManager.currentUser._id) {
      userActionTab.listItems = [
        {
          id: 'viewProfile',
          icon: 'glyphicon glyphicon-circle-arrow-right',
          text: state.strings['mainScreen.viewProfile'],
        },
      ];
    } else {
      userActionTab.listItems = [
        {
          id: 'viewProfile',
          icon: 'glyphicon glyphicon-warning-sign',
          text: state.strings['mainScreen.viewProfile'],
        },
      ];
      if (state.settings.messagingFeatureInstance && state.settings.messagingFeatureInstance.instanceId) {
        userActionTab.listItems.unshift({
          id: 'messageUser',
          icon: 'glyphicon glyphicon-circle-arrow-right',
          text: state.settings.actionItem ? state.settings.actionItem.title : state.strings['mainScreen.messageUser'],
        });
      }
    }

    if (state.settings.enableDirectoryBadges) {
      return [userActionTab, badgesTab];
    }
    return [userActionTab];
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
      case 'viewProfile':
        buildfire.auth.openProfile(this.userData.userId);
        break;
      case 'messageUser':
        const actionItem = state.settings.messagingFeatureInstance;
        const userIds = [this.userData.userId, authManager.currentUser._id];
        userIds.sort();

        const firstUserName = widgetUtils.getUserName(this.userData);
        const secondUserName = widgetUtils.getUserName(authManager.currentUser);

        const wTitle = `${firstUserName} | ${secondUserName}`;
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

    const userImageSrc = buildfire.auth.getUserPictureUrl({ userId: userData._id || userData.userId });
    widgetUtils.validateImage(userImageSrc).then((isValid) => {
      if (isValid) {
        this.userData.image = buildfire.imageLib.cropImage(userImageSrc, { size: 'm', aspect: '1:1' });
      } else {
        this.userData.image = buildfire.imageLib.cropImage('https://app.buildfire.com/app/media/avatar.png', { size: 'm', aspect: '1:1' });
      }

      const userBadgesIds = this.userData.badges ? this.userData.badges.map((badge) => badge.id) : [];
      UserDirectory.getUserBadges(userBadgesIds).then((userBadges) => {
        this.userData.badges = userBadges.map((badge) => ({ ...badge, imageUrl: buildfire.imageLib.cropImage(badge.imageUrl, { size: 's', aspect: '1:1' }) }));

        const header = this.initModalHeader();
        const tabs = this.initModalTabs();

        buildfire.spinner.hide();

        const drawerOptions = {
          header, enableFilter: false,
        };
        if (tabs.length === 1) {
          drawerOptions.listItems = tabs[0].listItems;
        } else {
          drawerOptions.tabs = tabs;
        }

        buildfire.components.drawer.open(drawerOptions, this.handleModalSelection.bind(this));
      });
    });
  },
};
