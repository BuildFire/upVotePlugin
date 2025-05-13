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
    const userActionTab = {
      text: '<span class="material-icons">person</span>',
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
        if (!authManager.currentUser) {
          return authManager.enforceLogin().then(() => UserModal.handleModalSelection(error, result));
        }
        if (authManager.currentUser._id === this.userData.userId) return;

        const actionItem = state.settings.messagingFeatureInstance;
        const userIds = [this.userData.userId, authManager.currentUser._id];
        userIds.sort();

        const firstUserName = widgetUtils.getUserName(this.userData);
        const secondUserName = widgetUtils.getUserName(authManager.currentUser);

        const wTitle = `${firstUserName} | ${secondUserName}`;
        const wid = userIds[0] + userIds[1];
        const receiverId = this.userData.userId;
        const queryString = widgetUtils.prepareDeeplinkQueryStringData({
          wid, wTitle, userIds, receiverId,
        });

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
  },
};
