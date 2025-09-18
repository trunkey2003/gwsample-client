/**
 * @fileoverview Main application controller that manages the Flexible Column Layout (FCL)
 * and handles routing for the SAP Fiori application.
 * @namespace ns.gwsampleclient.controller
 * @author SAP
 * @version 1.0.0
 */

sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/f/library"
    ],
    /**
     * Creates the App controller class
     * @param {sap.ui.core.mvc.Controller} BaseController - Base controller class
     * @param {sap.f.library} fioriLibrary - Fiori library for layout types
     * @returns {ns.gwsampleclient.controller.App} App controller class
     */
    function(BaseController, fioriLibrary) {
      "use strict";

      /**
       * Application controller that manages the main app layout and routing
       * @class ns.gwsampleclient.controller.App
       * @extends sap.ui.core.mvc.Controller
       */
      return BaseController.extend("ns.gwsampleclient.controller.App", {
        
        /**
         * Initializes the controller and sets up routing event handlers
         * @memberof ns.gwsampleclient.controller.App
         * @public
         * @override
         */
        onInit: function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
            this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
        },

        /**
         * Handles route matching event before the route is fully matched
         * Clears mid column pages when navigating to main route
         * @memberof ns.gwsampleclient.controller.App
         * @param {sap.ui.base.Event} oEvent - The route matched event
         * @private
         */
        onBeforeRouteMatched: function(oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oFCL = this.getView().byId("fcl");

            if (sRouteName === "RouteGWSample-Client") {
                oFCL.removeAllMidColumnPages();
            }
        },

        /**
         * Handles route matching event and updates the FCL layout accordingly
         * Sets appropriate layout based on the matched route
         * @memberof ns.gwsampleclient.controller.App
         * @param {sap.ui.base.Event} oEvent - The route matched event
         * @private
         */
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

        /**
         * Updates UI elements based on current route
         * Currently empty but can be extended for future UI updates
         * @memberof ns.gwsampleclient.controller.App
         * @private
         */
        _updateUIElements: function() {
            // Reserved for future UI element updates
        }
      });
    }
  );