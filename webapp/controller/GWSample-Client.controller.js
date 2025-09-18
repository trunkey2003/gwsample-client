sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/m/MessageBox", "sap/ui/model/json/JSONModel", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/GroupHeaderListItem"], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator, GroupHeaderListItem) {
    "use strict";

    return Controller.extend("ns.gwsampleclient.controller.GWSample-Client", {

        onInit: function () {
            console.log("Initializing Sales Order Controller");

            this.oRouter = this.getOwnerComponent().getRouter(); this.mainTable = this.getView().byId("mainSalesTable");

            var filterData = { searchCriteria: { salesOrderId: "", customerName: "", productName: "", customerId: "", productId: "" } };

            this.filterModel = new JSONModel(filterData); this.getView().setModel(this.filterModel, "searchModel");

            this.currentGroupField = "DeliveryStatus";

            this.mainTable.attachEventOnce("updateFinished", this.setupInitialGrouping.bind(this));

            console.log("Controller initialization complete");
        },

        setupInitialGrouping: function () {
            console.log("Setting up initial grouping by Delivery Status"); this.applyGrouping("DeliveryStatus");

            var deliveryToggle = this.byId("deliveryGroupToggle"); if (deliveryToggle) { deliveryToggle.setPressed(true); }
        }, buildGroupHeader: function (groupInfo) {
            var groupKey = groupInfo.key; var fieldName = this.currentGroupField; var displayText = groupKey; var itemCount = 0;

            var tableBinding = this.mainTable.getBinding("items"); var dataContexts = tableBinding.getContexts();

            for (var i = 0; i < dataContexts.length; i++) {
                var itemData = dataContexts[i].getObject();

                if (itemData[fieldName] === groupKey) {
                    itemCount++;

                    if (displayText === groupKey) { switch (fieldName) { case "DeliveryStatus": displayText = itemData.DeliveryStatusDescription; break; case "BillingStatus": displayText = itemData.BillingStatusDescription; break; default: displayText = groupKey; } }
                }
            }

            return new GroupHeaderListItem({ title: displayText + " (" + itemCount + " orders)", upperCase: false });
        },

        onSearch: function () {
            console.log("=== APPLYING FILTERS ===");

            try {
                var mainTable = this.byId("mainSalesTable"); if (!mainTable) { MessageBox.error("Main table not accessible!"); return; }

                var filterCriteria = this.filterModel.getProperty("/searchCriteria"); console.log("Filter criteria:", JSON.stringify(filterCriteria));

                var needsProductFilter = (filterCriteria.productId && filterCriteria.productId.trim()) || (filterCriteria.productName && filterCriteria.productName.trim());

                if (needsProductFilter) { console.log("Product-based filter detected - using expanded search"); this.executeProductBasedFilter(filterCriteria); return; }

                var tableBinding = mainTable.getBinding("items"); if (!tableBinding) { MessageBox.error("Table binding not available!"); return; }

                var appliedFilters = this.buildStandardFilters(filterCriteria);

                console.log("Applying", appliedFilters.length, "standard filters"); tableBinding.filter(appliedFilters);

                MessageToast.show("Filters applied: " + appliedFilters.length); setTimeout(this.refreshRecordCount.bind(this), 1000);

            } catch (error) { console.error("Error applying filters:", error); MessageBox.error("Filter Error: " + error.message); }
        },

        buildStandardFilters: function (criteria) {
            var filters = [];

            if (criteria.salesOrderId && criteria.salesOrderId.trim()) { filters.push(new Filter("SalesOrderID", FilterOperator.EQ, criteria.salesOrderId.trim())); console.log("Added Sales Order ID filter"); }

            if (criteria.customerId && criteria.customerId.trim()) { filters.push(new Filter("CustomerID", FilterOperator.EQ, criteria.customerId.trim())); console.log("Added Customer ID filter"); } else if (criteria.customerName && criteria.customerName.trim()) { filters.push(new Filter("CustomerName", FilterOperator.Contains, criteria.customerName.trim())); console.log("Added Customer Name filter"); }

            return filters;
        },

        executeProductBasedFilter: function (criteria) {
            console.log("=== PRODUCT-BASED FILTERING ===");

            var dataModel = this.getView().getModel(); var mainTable = this.byId("mainSalesTable"); var controller = this;

            mainTable.setBusy(true);

            dataModel.read("/SalesOrderSet", {
                urlParameters: ["$expand=ToLineItems"], success: function (responseData) {
                    console.log("Loaded sales orders:", responseData.results.length);

                    var matchingOrders = controller.filterOrdersByProduct(responseData.results, criteria); console.log("Orders matching criteria:", matchingOrders.length);

                    controller.applyFilteredResults(matchingOrders);

                    mainTable.setBusy(false);

                    var activeFilterCount = controller.countActiveFilters(criteria); MessageToast.show("Product filter completed. Found " + matchingOrders.length + " orders with " + activeFilterCount + " criteria.");
                }, error: function (error) { mainTable.setBusy(false); console.error("Error in product filtering:", error); MessageBox.error("Product filter failed: " + (error.message || "Unknown error")); }
            });
        },

        filterOrdersByProduct: function (salesOrders, criteria) {
            var filteredResults = [];

            salesOrders.forEach(function (order) {
                var shouldInclude = true;

                if (criteria.salesOrderId && criteria.salesOrderId.trim()) { if (order.SalesOrderID !== criteria.salesOrderId.trim()) { shouldInclude = false; } }

                if (shouldInclude && criteria.customerId && criteria.customerId.trim()) { if (order.CustomerID !== criteria.customerId.trim()) { shouldInclude = false; } } else if (shouldInclude && criteria.customerName && criteria.customerName.trim()) { var customerName = order.CustomerName || ""; if (customerName.toLowerCase().indexOf(criteria.customerName.trim().toLowerCase()) === -1) { shouldInclude = false; } }

                if (shouldInclude && criteria.productId && criteria.productId.trim()) {
                    var hasMatchingProduct = false;

                    if (order.ToLineItems && order.ToLineItems.results) { order.ToLineItems.results.forEach(function (lineItem) { if (lineItem.ProductID === criteria.productId.trim()) { hasMatchingProduct = true; } }); }

                    if (!hasMatchingProduct) { shouldInclude = false; }
                }

                if (shouldInclude) { filteredResults.push(order); }
            });

            return filteredResults;
        },

        applyFilteredResults: function (matchingOrders) {
            var mainTable = this.byId("mainSalesTable"); var tableBinding = mainTable.getBinding("items");

            if (matchingOrders.length === 0) {

                tableBinding.filter([new Filter("SalesOrderID", FilterOperator.EQ, "NO_MATCH_FOUND")]);
            } else {

                var orderIdFilters = []; matchingOrders.forEach(function (order) { orderIdFilters.push(new Filter("SalesOrderID", FilterOperator.EQ, order.SalesOrderID)); });

                var combinedFilter = new Filter(orderIdFilters, false); tableBinding.filter([combinedFilter]);
            }

            console.log("Applied product filter results"); this.refreshRecordCount();
        },

        countActiveFilters: function (criteria) { var count = 0; if (criteria.salesOrderId && criteria.salesOrderId.trim()) count++; if (criteria.customerId && criteria.customerId.trim()) count++; else if (criteria.customerName && criteria.customerName.trim()) count++; if (criteria.productId && criteria.productId.trim()) count++; return count; },

        onClearSearch: function () {
            console.log("=== CLEARING ALL FILTERS ===");

            try {

                this.filterModel.setProperty("/searchCriteria", { salesOrderId: "", customerName: "", productName: "", customerId: "", productId: "" });

                console.log("Filter criteria reset");

                var mainTable = this.byId("mainSalesTable"); if (mainTable) { var tableBinding = mainTable.getBinding("items"); if (tableBinding) { tableBinding.filter([]); console.log("Table filters cleared"); } }

                MessageToast.show("All filters cleared"); setTimeout(this.refreshRecordCount.bind(this), 1000);

            } catch (error) { console.error("Error clearing filters:", error); MessageBox.error("Clear Error: " + error.message); }
        },

        refreshRecordCount: function (customCount) {

        },

        onOrderItemSelected: function (event) {
            var bindingContext = event.getSource().getBindingContext(); var orderID = bindingContext.getProperty("SalesOrderID");

            this.oRouter.navTo("SalesOrderDetail", { salesOrderId: orderID });
        },

        onSalesOrderValueHelp: function () { var dialog = this.byId("orderSelectionDialog"); if (dialog) { dialog.open(); } else { MessageBox.error("Order selection dialog not found."); } },

        onOrderDialogFilter: function (event) {
            var searchValue = event.getParameter("value"); var dialogBinding = event.getSource().getBinding("items"); var filters = [];

            if (searchValue) { filters.push(new Filter("SalesOrderID", FilterOperator.Contains, searchValue)); }

            dialogBinding.filter(filters);
        },

        onOrderDialogAccept: function (event) { var selectedItem = event.getParameter("selectedItem"); if (selectedItem) { var orderID = selectedItem.getTitle(); this.filterModel.setProperty("/searchCriteria/salesOrderId", orderID); MessageToast.show("Selected Order: " + orderID); } },

        onOrderDialogCancel: function () {

        },

        onCustomerValueHelp: function () { var dialog = this.byId("customerSelectionDialog"); if (dialog) { dialog.open(); } else { MessageBox.error("Customer selection dialog not found."); } },

        onCustomerDialogFilter: function (event) {
            var searchValue = event.getParameter("value"); var dialogBinding = event.getSource().getBinding("items"); var filters = [];

            if (searchValue) { filters.push(new Filter("CompanyName", FilterOperator.Contains, searchValue)); }

            dialogBinding.filter(filters);
        },

        onCustomerDialogAccept: function (event) { var selectedItem = event.getParameter("selectedItem"); if (selectedItem) { var customerName = selectedItem.getTitle(); var customerID = selectedItem.getDescription(); this.filterModel.setProperty("/searchCriteria/customerName", customerName); this.filterModel.setProperty("/searchCriteria/customerId", customerID); MessageToast.show("Selected Customer: " + customerName); } },

        onCustomerDialogCancel: function () {

        },

        onProductValueHelp: function () { var dialog = this.byId("productSelectionDialog"); if (dialog) { dialog.open(); } else { MessageBox.error("Product selection dialog not found."); } },

        onProductDialogFilter: function (event) {
            var searchValue = event.getParameter("value"); var dialogBinding = event.getSource().getBinding("items"); var filters = [];

            if (searchValue) { var nameFilter = new Filter("Name", FilterOperator.Contains, searchValue); var idFilter = new Filter("ProductID", FilterOperator.Contains, searchValue); filters.push(new Filter([nameFilter, idFilter], false)); }

            dialogBinding.filter(filters);
        },

        onProductDialogAccept: function (event) {
            var selectedItem = event.getParameter("selectedItem"); if (selectedItem) {
                var productName = selectedItem.getTitle(); var description = selectedItem.getDescription(); var productID = description ? description.split(" - ")[0] : "";

                this.filterModel.setProperty("/searchCriteria/productName", productName); this.filterModel.setProperty("/searchCriteria/productId", productID); MessageToast.show("Selected Product: " + productName);
            }
        },

        onProductDialogCancel: function () {

        },

        onRegenerateData: function () {
            var controller = this;

            MessageBox.confirm("This action will regenerate all system data. Do you want to proceed?", { title: "Data Regeneration", onClose: function (action) { if (action === MessageBox.Action.OK) { controller.executeDataRegeneration(); } } });
        },

        executeDataRegeneration: function () {
            var dataModel = this.getView().getModel(); var controller = this;

            this.getView().setBusy(true);

            dataModel.callFunction("/RegenerateAllData", {
                method: "POST", urlParameters: { NoOfSalesOrders: 50 }, success: function (data, response) {
                    controller.getView().setBusy(false);

                    var message = data && data.String ? data.String : "Data regeneration completed successfully!"; MessageToast.show(message);

                    controller.refreshAllData();
                }, error: function (error) {
                    controller.getView().setBusy(false);

                    var errorMessage = "Data regeneration failed"; try { var errorData = JSON.parse(error.responseText); if (errorData && errorData.error && errorData.error.message && errorData.error.message.value) { errorMessage = errorData.error.message.value; } } catch (parseError) {

                    }

                    MessageBox.error(errorMessage);
                }
            });
        },

        refreshAllData: function () {
            this.onClearSearch();

            var mainTable = this.byId("mainSalesTable"); if (mainTable) { var tableBinding = mainTable.getBinding("items"); if (tableBinding) { tableBinding.refresh(); } }

            this.refreshRecordCount();
        },

        onDeliveryGroupToggle: function (oEvent) {
            var bPressed = oEvent.getParameter("pressed");

            if (bPressed) {

                this.byId("billingGroupToggle").setPressed(false);

                this.applyGrouping("DeliveryStatus");

                MessageToast.show("Grouped by Delivery Status");
            } else {

                if (!this.byId("billingGroupToggle").getPressed()) { this.clearGrouping(); }
            }
        },

        onBillingGroupToggle: function (oEvent) {
            var bPressed = oEvent.getParameter("pressed");

            if (bPressed) {

                this.byId("deliveryGroupToggle").setPressed(false);

                this.applyGrouping("BillingStatus");

                MessageToast.show("Grouped by Billing Status");
            } else {

                if (!this.byId("deliveryGroupToggle").getPressed()) { this.clearGrouping(); }
            }
        },

        onClearGrouping: function () {

            this.byId("deliveryGroupToggle").setPressed(false); this.byId("billingGroupToggle").setPressed(false);

            this.clearGrouping();

            MessageToast.show("Grouping cleared");
        },

        applyGrouping: function (sGroupField) {
            try {
                var mainTable = this.byId("mainSalesTable"); if (!mainTable) { MessageBox.error("Main table not accessible for grouping!"); return; }

                var tableBinding = mainTable.getBinding("items"); if (!tableBinding) { MessageBox.error("Table binding not available for grouping!"); return; }

                this.currentGroupField = sGroupField;

                var groupSorter = new sap.ui.model.Sorter(sGroupField, false, true);

                tableBinding.sort([groupSorter]);

                console.log("Grouping applied successfully by:", sGroupField);

            } catch (error) { console.error("Error applying grouping:", error); MessageBox.error("Grouping Error: " + error.message); }
        },

        clearGrouping: function () {
            try {
                var mainTable = this.byId("mainSalesTable"); if (!mainTable) { return; }

                var tableBinding = mainTable.getBinding("items"); if (!tableBinding) { return; }

                this.currentGroupField = null;

                tableBinding.sort([]);

                console.log("Grouping cleared successfully");

            } catch (error) { console.error("Error clearing grouping:", error); MessageBox.error("Clear Grouping Error: " + error.message); }
        },

        buildGroupHeader: function (groupInfo) {
            var groupKey = groupInfo.key; var fieldName = this.currentGroupField; var displayText = groupKey; var itemCount = 0;

            if (!fieldName) { return new GroupHeaderListItem({ title: "Ungrouped Items", upperCase: false }); }

            var tableBinding = this.mainTable.getBinding("items"); var dataContexts = tableBinding.getContexts();

            for (var i = 0; i < dataContexts.length; i++) {
                var itemData = dataContexts[i].getObject();

                if (itemData[fieldName] === groupKey) {
                    itemCount++;

                    if (displayText === groupKey) { switch (fieldName) { case "DeliveryStatus": displayText = itemData.DeliveryStatusDescription || groupKey; break; case "BillingStatus": displayText = itemData.BillingStatusDescription || groupKey; break; default: displayText = groupKey; } }
                }
            }

            return new GroupHeaderListItem({ title: displayText + " (" + itemCount + " orders)", upperCase: false });
        },



        getGroupingStatistics: function () {
            if (!this.currentGroupField) { return null; }

            var mainTable = this.byId("mainSalesTable"); if (!mainTable) { return null; }

            var tableBinding = mainTable.getBinding("items"); if (!tableBinding) { return null; }

            var dataContexts = tableBinding.getContexts(); var groupStats = {}; var totalItems = 0;

            dataContexts.forEach(function (context) {
                var itemData = context.getObject(); var groupKey = itemData[this.currentGroupField]; var displayKey = "";

                switch (this.currentGroupField) { case "DeliveryStatus": displayKey = itemData.DeliveryStatusDescription || groupKey; break; case "BillingStatus": displayKey = itemData.BillingStatusDescription || groupKey; break; default: displayKey = groupKey; }

                if (!groupStats[displayKey]) { groupStats[displayKey] = { count: 0, totalValue: 0, key: groupKey }; }

                groupStats[displayKey].count++; groupStats[displayKey].totalValue += parseFloat(itemData.GrossAmount) || 0; totalItems++;
            }.bind(this));

            return { groups: groupStats, totalItems: totalItems, groupField: this.currentGroupField };
        },

        showGroupingStatistics: function () {
            var stats = this.getGroupingStatistics();

            if (!stats) { MessageBox.information("No grouping applied or data available."); return; }

            var message = "Grouping Statistics:\n\n"; message += "Grouped by: " + stats.groupField + "\n"; message += "Total Items: " + stats.totalItems + "\n\n";

            Object.keys(stats.groups).forEach(function (groupName) { var group = stats.groups[groupName]; message += groupName + ": " + group.count + " orders"; message += " (Total Value: " + group.totalValue.toFixed(2) + ")\n"; });

            MessageBox.information(message, { title: "Grouping Statistics" });
        },
    });
});