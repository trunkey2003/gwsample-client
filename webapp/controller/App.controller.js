sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/f/library"
    ],
    function(BaseController, fioriLibrary) {
      "use strict";

      return BaseController.extend("ns.gwsampleclient.controller.App", {
        onInit: function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
            this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
        },

        onBeforeRouteMatched: function(oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oFCL = this.getView().byId("fcl");

            if (sRouteName === "RouteGWSample-Client") {
                oFCL.removeAllMidColumnPages();
            }
        },

        onRouteMatched: function(oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oArguments = oEvent.getParameter("arguments");
            var oFCL = this.getView().byId("fcl");

            this._updateUIElements();

            switch (sRouteName) {
                case "RouteGWSample-Client":
                    oFCL.setLayout(fioriLibrary.LayoutType.OneColumn);
                    break;
                case "SalesOrderDetail":
                    oFCL.setLayout(fioriLibrary.LayoutType.TwoColumnsMidExpanded);
                    break;
                default:
                    oFCL.setLayout(fioriLibrary.LayoutType.OneColumn);
                    break;
            }
        },

        _updateUIElements: function() {

        }
      });
    }
  );