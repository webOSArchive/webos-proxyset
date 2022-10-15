enyo.kind({
    name: "appMuseum.AppMenu",
    kind: "enyo.AppMenu",
    published: {

    },
    events: {
        onItemSelected: ''
    },
    components: [
        { caption: "About", onclick: "menuClicked" },
        { caption: "Reset to Defaults", onclick: "menuClicked" },
    ],
    create: function() {
        this.inherited(arguments);
    },

    menuClicked: function(inSender, inEvent) {
        this.doItemSelected(inSender.value);
    }
});