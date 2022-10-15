enyo.kind({
	name: "ProxyPrefApp",
	kind: "VFlexBox",
	defaultServer: "proxy.webosarchive.org",
	defaultPort: 3128,
	certRemotePath: "http://www.webosarchive.org/proxy/wOSAServiceCert.der",
	certLocalPath: "/media/internal/wOSAServiceCert.der",
	proxyOn: false,
	LABEL_CONNECTED_NETWORK: $L("Connected to "),

	components:[
		{kind: "WebService", name: "proxyHeaderCheck", url: "https://www.webosarchive.org", onSuccess: "headerCheckSuccess", onFailure: "headerCheckFailure" },
		{kind: "PalmService", name: "configureNwProxiesCall", service: "palm://com.palm.connectionmanager/", method: "configureNwProxies", onResponse: "handleConnectionStatus" },
		{kind: "PalmService", name: "fileDownload", service: "palm://com.palm.downloadmanager/", method: "download", onSuccess: "downloadFinished", onFailure: "downloadFail", subscribe: true },
		{kind: "PalmService", name: "certInstallRequest", service: "palm://com.palm.certificatemanager", method: "addcertificate", onSuccess: "certificateAddSuccess", onFailure: "certificateAddFailure" },
		{kind: "PalmService", name: "launchAppRequest", service: "palm://com.palm.applicationManager/", method: "open", onSuccess: "", onFailure: "certificateLaunchFailure" },
		{kind: "ApplicationEvents", onWindowActivated: "handleActivate", onWindowDeactivated: "handleDeactivate", onApplicationRelaunch: "handleLaunchParam"},

		{kind: "Toolbar", pack: "center", name:"toolbarTop", className: "enyo-toolbar-light wifi-header", components: [
			{kind: "Spacer", name:"spacerTP", flex: 1, showing: true },
			{kind: "HFlexBox", pack: "center", name:"headerIcon", align: "center", components: [
				{className: "header-icon"},
				{content: $L("Proxy"), name: "headerTitle", class: "headerTitle"}
			]},
			{kind: "Spacer", name:"spacerPhone", flex: 1, showing: false },
			{flex: 1, components: [{kind: "ToggleButton", flex: 1, name: "proxyToggleButton", style: "float: right; padding: 0px;", showing:false, onChange: "handleProxyToggleChange"}]}
		]},
		{className:"wifi-header-shadow"},
		{className:"touchpad-margin", name: "tpmargin"},
		
		{kind: "Scroller", flex: 1, className: "box-center", components: [
			{kind: "RowGroup", caption: "Encryption", components: [
				{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
						{flex:1, content: $L("Install Certificate")},
						{kind: "Button", name:'btnInstallCert', onclick:"downloadCert", style:"margin: -5px", components: [
							{kind: "enyo.Image", src: "images/InstallCert.png", alt: "Install", style:"margin: -5px"}
						]}
				]}
			]},
			{name:"txtCertificateRequired", className: "footnote-text", srcId:"certContent", content:"Installing the latest certificate from the proxy prevents errors and confirmation pop-ups during browsing."},
			{
				kind: "RowGroup",
				caption: "Server",
				pack: "center",
				align: "start",
				class: "enyo-first",
				components: [
					{ name: "proxyServer", kind: "Input", value: this.defaultServer, pack: "center", align: "start", lazy: false, onchange: "checkServer" },
				]
			},
			{
				kind: "RowGroup",
				caption: "Port",
				pack: "center",
				align: "start",
				components: [
					{ name: "proxyPort", kind: "Input", value: this.defaultPort, pack: "center", align: "start", lazy: false, onchange: "checkPort" },
				]
			},
			{
				kind: "RowGroup",
				caption: "Username",
				pack: "center",
				align: "start",
				components: [
					{ name: "proxyUserName", kind: "Input", value: "", pack: "center", align: "start", lazy: false },
				]
			},
			{
				kind: "RowGroup",
				caption: "Password",
				pack: "center",
				align: "start",
				class: "enyo-list",
				components: [
					{ name: "proxyPassword", kind: "PasswordInput", value: "", pack: "center", align: "start", lazy: false },
				]
			},
			{name:"txtAccountInfo", className: "footnote-text", srcId:"certContent", content:"If you need an account, visit http://www.webosarchive.org/proxy on a modern computer to sign up!"},
		]},


		{kind: "AppMenu", components: [
			{caption: $L("Reset"), onclick: "resetToDefaults"},
			{kind: "HelpMenu", target: "http://www.webosarchive.org/proxy"}
		]},

		{
            kind: "Dialog",
            name: "alert",
            lazy: false,
            components: [{
                layoutKind: "HFlexLayout",
                pack: "center",
                components: [
                    { name: "alertMsg", kind: "HtmlContent", flex: 1, pack: "center", align: "start", style: "text-align: center;" },
                ]
            }]
        },
		{
            kind: "DialogPrompt",
            name: "prompt",
            lazy: false,
			title: "Already Installed",
			message: "The certificate was previously installed. Do you want to launch the Certificates app to delete or manage it?",
			acceptButtonCaption: "Yes",
			cancelButtonCaption: "No",
			onAccept: "manageCertificates",
        },
	],

	create: function() {
		this.inherited(arguments);
		this.handleLaunchParam();
		this.$.proxyHeaderCheck.call();
		this.proxyOn = Prefs.getCookie("proxyState", this.proxyOn);
		this.setToggleProxy();
		this.applySettings();

		if(!this.isTouchpad()) {
			this.$.spacerTP.hide();
			this.$.spacerPhone.show();
			this.$.headerIcon.addClass("smallIcon");
			this.$.tpmargin.hide();
		} else {
			this.$.headerIcon.addClass("bigIcon");
			this.$.headerTitle.addClass("headerTitleTouchpad")
		}
	},

	handleActivate: function () {
	},

	handleDeactivate: function () {
	},

	handleLaunchParam: function () {
		/*
		if (undefined !== enyo.windowParams.target &&
				undefined !== enyo.windowParams.target.ssid &&
				undefined !== enyo.windowParams.target.securityType) {
			if ("ipFailed" === enyo.windowParams.target.connectState ||
					"ipConfigured" === enyo.windowParams.target.connectState) {
				this.$.wifiPrefConfig.retrieveIpInfo(enyo.windowParams.target);
			} else {
				this.$.wifiPrefConfig.showJoinSecureNetwork(enyo.windowParams.target);
			}
		}*/
	},

	setToggleProxy: function() {
		this.$.proxyToggleButton.show();
		this.$.proxyToggleButton.setState(this.proxyOn);
		this.toggleTextFields();
	},
	toggleTextFields: function() {
		if (this.$.proxyToggleButton.getState()) {
			this.$.proxyServer.setDisabled(true);
			this.$.proxyPort.setDisabled(true);
			this.$.proxyUserName.setDisabled(true);
			this.$.proxyPassword.setDisabled(true);
		} else {
			this.$.proxyServer.setDisabled(false);
			this.$.proxyPort.setDisabled(false);
			this.$.proxyUserName.setDisabled(false);
			this.$.proxyPassword.setDisabled(false);
		}
	},
	checkServer: function() {
		var server = this.$.proxyServer.getValue();
		if (server == "" || server.length < 3) {
			this.$.alertMsg.setContent("Server must be at least 3 characters long!");
			this.$.alert.open();
			return false;
		}
		return true;
	},
	checkPort: function() {
		var valid = true;
		var port = this.$.proxyPort.getValue();
		port = parseInt(port)
		if (isNaN(port)) {
			valid = false;
		}
		if (port < 1 || port > 65535) {
			valid = false;
		}
		if (!valid) {
			this.$.alertMsg.setContent("Port must be a numerical value between 1 and 65535!");
			this.$.alert.open();
			return false;
		}
		return true;
	},
	handleProxyToggleChange: function(inSender, inState) {
		if (inState) {
			if (this.checkServer() && this.checkPort()) {
				enyo.log("Turn proxy on!");
				this.addSpecifiedProxies();
			}
			else {
				enyo.log("Cancel turning proxy on!");
				this.proxyOn = false;
				this.setToggleProxy();
				return;
			}
		}
		else {
			enyo.log("Turn proxy off!");
			this.removeAllProxies();
		}
		this.proxyOn = inState;
		this.proxyOn = Prefs.setCookie("proxyState", inState);
		this.toggleTextFields();
	},

	resetToDefaults: function(inSender) {
		this.$.proxyServer.setValue(this.defaultServer);
		this.$.proxyPort.setValue(this.defaultPort);
		this.$.proxyUserName.setValue("");
		this.$.proxyPassword.setValue("");
		this.saveSettings();
		this.proxyOn = false;
		this.removeAllProxies();
		this.setToggleProxy();
	},
	saveSettings: function() {
		Prefs.setCookie("server", this.$.proxyServer.getValue());
		Prefs.setCookie("port", this.$.proxyPort.getValue());
		Prefs.setCookie("username", this.$.proxyUserName.getValue());
		Prefs.setCookie("password", this.$.proxyPassword.getValue());
	},
	applySettings: function() {
		this.$.proxyServer.setValue(Prefs.getCookie("server", this.defaultServer));
		this.$.proxyPort.setValue(Prefs.getCookie("port", this.defaultPort));
		this.$.proxyUserName.setValue(Prefs.getCookie("username", ""));
		this.$.proxyPassword.setValue(Prefs.getCookie("password", ""));
	},

	addSpecifiedProxies: function() {
		this.saveSettings();
		var server = this.$.proxyServer.getValue();
        var port = this.$.proxyPort.getValue();
        var username = this.$.proxyUserName.getValue();
        var password = this.$.proxyPassword.getValue();
		var useServer = username + ":" + password + "@" + server;

		var proxyArgs = '{"action":"add","proxyInfo":{"proxyConfigType":"manualProxy","networkTechnology":"default","proxyScope":"default","isSecureProxy":true,"proxyPort":' + port + ',"proxyServer":"' + useServer + '"}}';
        enyo.log("On: configureNWProxiesCall.call(" + proxyArgs + ")");
        this.$.configureNwProxiesCall.call(proxyArgs);
	},
	removeAllProxies: function() {
		var proxyArgs = '{"action":"rmv","proxyInfo":{"proxyConfigType":"noProxy","proxyScope":"default"}}';
        enyo.log("Off: configureNWProxiesCall.call(" + proxyArgs + ")");
        this.$.configureNwProxiesCall.call(proxyArgs);
	},

    downloadCert: function(inSender, inResponse) {
        enyo.log("** downloading: " + this.certRemotePath);
        this.$.fileDownload.call({
            target: this.certRemotePath,
            mime: "application/x-x509-ca-cert",
            targetDir: "/media/internal/",
            targetFilename: "wOSAServiceCert.der",
            keepFilenameOnRedirect: false,
            canHandlePause: false,
            subscribe: true
        });
    },
    downloadFinished: function(inSender, inResponse) {
        enyo.log("Download success, results=" + enyo.json.stringify(inResponse));
        if (inResponse.httpStatus == 200 || (!inResponse.httpStatus && inResponse.completionStatusCode == 200)) {
			this.$.alertMsg.setContent("Certificate downloaded!");
            this.$.alert.open();
            this.$.certInstallRequest.call({ certificateFilename: this.certLocalPath });
        }
    },
    downloadFail: function(inSender, inResponse) {
        enyo.log("Download failure, results=" + enyo.json.stringify(inResponse));
        this.$.alertMsg.setContent("Failed to download certificate! Make sure you're online!");
        this.$.alert.open();
    },
	certificateAddSuccess: function(inSender, inResponse) {
		this.$.alert.close();
        enyo.log("got success from add certificate...");
		enyo.log(inResponse);
		this.$.alertMsg.setContent("Certificate installed!");
		this.$.alert.open();
    },
    certificateAddFailure: function(inSender, inResponse) {
		this.$.alert.close();
        enyo.log("got failure from add certificate...");
        enyo.log(inResponse);
		if (inResponse.errorCode == 10) {
			this.$.prompt.open();
		} else {
			this.$.alertMsg.setContent("Failed to install certificate (" + inResponse.errorCode + ")");
			this.$.alert.open();
		}
    },
	manageCertificates: function() {
		this.$.launchAppRequest.call({ id: "com.palm.app.certificate" });
	},
	certificateLaunchFailure: function() {
		this.$.alertMsg.setContent("There was an error launching the Certificates app. Go to the Device Info app, and choose Certificates from its menu.");
		this.$.alert.open();		
	},

	handleConnectionStatus: function(inSender, inResponse) {
		enyo.log("got response from connection manager...");
		enyo.log(inResponse);
	},
	headerCheckSuccess: function(inSender, inResponse, inRequest) {
		//We have no reliable way to know if the proxy was set in another app
		//	but we can try checking response headers...
        enyo.log("header check response...");
		enyo.log("X-Forwarded-For", inRequest.xhr.getResponseHeader("X-Forwarded-For"));
		enyo.log("X-Cache", inRequest.xhr.getResponseHeader("X-Cache"));	
		enyo.log("Via", inRequest.xhr.getResponseHeader("Via"));
		if (inRequest.xhr.getResponseHeader("X-Forwarded-For") || inRequest.xhr.getResponseHeader("Via") || inRequest.xhr.getResponseHeader("X-Cache")) {
			enyo.log("it looks like there's a proxy on!");
			this.proxyOn = true;
		}
		this.setToggleProxy();
    },
    headerCheckFailure: function(inSender, inResponse, inRequest) {
        enyo.error("Got failure from header check, we might not be online: " + inResponse);
    },

	isTouchpad: (function() {
		// TODO: we should us the cleaner Palm-approach here.
		var minSize = Math.min(window.innerWidth, window.innerHeight);
		var touchpad = true;
		if (minSize < 600) {
			// we're on a touchpad (even the Pre3 will be 480 here);
			iconLocationPlus = "";
			touchpad = false;
		}
	
		var device;
		if (window.PalmSystem) {
			device = JSON.parse(PalmSystem.deviceInfo);
		} else {
			device = {
				modelNameAscii: "webOS device"
			}
		}
		return touchpad;
	})

});
