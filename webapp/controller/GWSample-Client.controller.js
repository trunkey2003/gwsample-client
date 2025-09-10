sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("ns.gwsampleclient.controller.GWSample-Client", {
        onInit: function () {
            console.log("Controller initialized");

            this.oRouter = this.getOwnerComponent().getRouter();

            // Create search model
            var oSearchData = {
                searchCriteria: {
                    salesOrderId: "",
                    customerName: "",
                    productName: "",
                    customerId: "",
                    productId: ""
                }
            };

            this.oSearchModel = new JSONModel(oSearchData);
            this.getView().setModel(this.oSearchModel, "searchModel");

            console.log("Search model created and set");
        },

        // ============= SEARCH FUNCTIONALITY =============

        onSearch: function () {
            console.log("=== SEARCH BUTTON CLICKED ===");

            try {
                var oTable = this.byId("salesOrderTable");
                if (!oTable) {
                    MessageBox.error("Table not found!");
                    return;
                }

                // Get search criteria
                var oSearchCriteria = this.oSearchModel.getProperty("/searchCriteria");
                console.log("Search criteria:", JSON.stringify(oSearchCriteria));

                // Check if ONLY product filter is specified (this is the problematic case)
                var bHasProductFilter = (oSearchCriteria.productId && oSearchCriteria.productId.trim()) ||
                    (oSearchCriteria.productName && oSearchCriteria.productName.trim());
                var bHasOtherFilters = (oSearchCriteria.salesOrderId && oSearchCriteria.salesOrderId.trim()) ||
                    (oSearchCriteria.customerId && oSearchCriteria.customerId.trim()) ||
                    (oSearchCriteria.customerName && oSearchCriteria.customerName.trim());

                if (bHasProductFilter) {
                    console.log("Product filter detected - using complex search");
                    this._searchWithProductFilter(oSearchCriteria);
                    return;
                }

                // Simple search using standard OData filtering (this always worked)
                var oBinding = oTable.getBinding("items");
                if (!oBinding) {
                    MessageBox.error("Table binding not found!");
                    return;
                }

                var aFilters = [];

                // Sales Order ID filter
                if (oSearchCriteria.salesOrderId && oSearchCriteria.salesOrderId.trim()) {
                    aFilters.push(new Filter("SalesOrderID", FilterOperator.EQ, oSearchCriteria.salesOrderId.trim()));
                    console.log("Added filter for SalesOrderID");
                }

                // Customer filter
                if (oSearchCriteria.customerId && oSearchCriteria.customerId.trim()) {
                    aFilters.push(new Filter("CustomerID", FilterOperator.EQ, oSearchCriteria.customerId.trim()));
                    console.log("Added filter for CustomerID");
                } else if (oSearchCriteria.customerName && oSearchCriteria.customerName.trim()) {
                    aFilters.push(new Filter("CustomerName", FilterOperator.Contains, oSearchCriteria.customerName.trim()));
                    console.log("Added filter for CustomerName");
                }

                console.log("Applying", aFilters.length, "standard filters");
                oBinding.filter(aFilters);

                MessageToast.show("Search applied with " + aFilters.length + " filter(s)");
                setTimeout(this._updateRecordCount.bind(this), 1000);

            } catch (error) {
                console.error("Error in search:", error);
                MessageBox.error("Error: " + error.message);
            }
        },

        _searchWithProductFilter: function (oSearchCriteria) {
            console.log("=== COMPLEX SEARCH WITH PRODUCT FILTER ===");

            var oModel = this.getView().getModel();
            var oTable = this.byId("salesOrderTable");
            var that = this;

            oTable.setBusy(true);

            // Read sales orders with expanded line items
            oModel.read("/SalesOrderSet", {
                urlParameters: ["$expand=ToLineItems"],
                success: function (oData) {
                    console.log("Total sales orders loaded:", oData.results.length);

                    var aFilteredSalesOrders = [];

                    oData.results.forEach(function (oSalesOrder) {
                        var bInclude = true;

                        // Apply Sales Order ID filter
                        if (oSearchCriteria.salesOrderId && oSearchCriteria.salesOrderId.trim()) {
                            if (oSalesOrder.SalesOrderID !== oSearchCriteria.salesOrderId.trim()) {
                                bInclude = false;
                            }
                        }

                        // Apply Customer filter
                        if (bInclude && oSearchCriteria.customerId && oSearchCriteria.customerId.trim()) {
                            if (oSalesOrder.CustomerID !== oSearchCriteria.customerId.trim()) {
                                bInclude = false;
                            }
                        } else if (bInclude && oSearchCriteria.customerName && oSearchCriteria.customerName.trim()) {
                            var sCustomerName = oSalesOrder.CustomerName || "";
                            if (sCustomerName.toLowerCase().indexOf(oSearchCriteria.customerName.trim().toLowerCase()) === -1) {
                                bInclude = false;
                            }
                        }

                        // Apply Product filter
                        if (bInclude && oSearchCriteria.productId && oSearchCriteria.productId.trim()) {
                            var bProductFound = false;

                            if (oSalesOrder.ToLineItems && oSalesOrder.ToLineItems.results) {
                                oSalesOrder.ToLineItems.results.forEach(function (oLineItem) {
                                    if (oLineItem.ProductID === oSearchCriteria.productId.trim()) {
                                        bProductFound = true;
                                    }
                                });
                            }

                            if (!bProductFound) {
                                bInclude = false;
                            }
                        }

                        if (bInclude) {
                            aFilteredSalesOrders.push(oSalesOrder);
                        }
                    });

                    console.log("Filtered results:", aFilteredSalesOrders.length);

                    // Use a simple approach: Apply the filtered IDs as a filter to the original table
                    that._applyProductFilterResults(aFilteredSalesOrders);

                    oTable.setBusy(false);

                    var iFilterCount = that._countActiveFilters(oSearchCriteria);
                    MessageToast.show("Search completed with " + iFilterCount + " filter(s). Found " + aFilteredSalesOrders.length + " records.");
                },
                error: function (oError) {
                    oTable.setBusy(false);
                    console.error("Error in complex search:", oError);
                    MessageBox.error("Error during search: " + (oError.message || "Unknown error"));
                }
            });
        },

        _applyProductFilterResults: function (aFilteredSalesOrders) {
            var oTable = this.byId("salesOrderTable");
            var oBinding = oTable.getBinding("items");

            if (aFilteredSalesOrders.length === 0) {
                // No results - filter everything out
                oBinding.filter([new Filter("SalesOrderID", FilterOperator.EQ, "IMPOSSIBLE_ID")]);
            } else {
                // Create OR filter for all found Sales Order IDs
                var aIDFilters = [];
                aFilteredSalesOrders.forEach(function (oOrder) {
                    aIDFilters.push(new Filter("SalesOrderID", FilterOperator.EQ, oOrder.SalesOrderID));
                });

                // Apply as OR filter
                var oMainFilter = new Filter(aIDFilters, false); // false = OR
                oBinding.filter([oMainFilter]);
            }

            console.log("Applied product filter results to original table");
            this._updateRecordCount();
        },

        _countActiveFilters: function (oSearchCriteria) {
            var iCount = 0;
            if (oSearchCriteria.salesOrderId && oSearchCriteria.salesOrderId.trim()) iCount++;
            if (oSearchCriteria.customerId && oSearchCriteria.customerId.trim()) iCount++;
            else if (oSearchCriteria.customerName && oSearchCriteria.customerName.trim()) iCount++;
            if (oSearchCriteria.productId && oSearchCriteria.productId.trim()) iCount++;
            return iCount;
        },

        onClearSearch: function () {
            console.log("=== CLEAR BUTTON CLICKED ===");

            try {
                // Clear search model
                this.oSearchModel.setProperty("/searchCriteria", {
                    salesOrderId: "",
                    customerName: "",
                    productName: "",
                    customerId: "",
                    productId: ""
                });

                console.log("Search criteria cleared");

                var oTable = this.byId("salesOrderTable");
                if (oTable) {
                    // Simply clear all filters - table stays with original binding
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        oBinding.filter([]);
                        console.log("All filters cleared from original table binding");
                    }
                }

                MessageToast.show("Search criteria cleared");
                setTimeout(this._updateRecordCount.bind(this), 1000);

            } catch (error) {
                console.error("Error in clear:", error);
                MessageBox.error("Error: " + error.message);
            }
        },

        _updateRecordCount: function (iCustomCount) {
            var oTable = this.byId("salesOrderTable");
            var oRecordCountText = this.byId("recordCountText");

            if (oTable && oRecordCountText) {
                if (iCustomCount !== undefined) {
                    oRecordCountText.setText("Records: " + iCustomCount);
                } else {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        var iLength = oBinding.getLength();
                        oRecordCountText.setText("Records: " + (iLength || 0));
                    }
                }
            }
        },

        // ============= KEEP ORIGINAL PRESS HANDLER (unchanged) =============

        onSalesOrderPress: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sSalesOrderId = oBindingContext.getProperty("SalesOrderID");

            this.oRouter.navTo("SalesOrderDetail", {
                salesOrderId: sSalesOrderId
            });
        },

        // ============= VALUE HELP FUNCTIONS (unchanged) =============

        onSalesOrderValueHelp: function () {
            var oDialog = this.byId("salesOrderDialog");
            if (oDialog) {
                oDialog.open();
            } else {
                MessageBox.error("Sales Order dialog not found.");
            }
        },

        onSalesOrderDialogSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");
            var aFilters = [];

            if (sValue) {
                aFilters.push(new Filter("SalesOrderID", FilterOperator.Contains, sValue));
            }

            oBinding.filter(aFilters);
        },

        onSalesOrderDialogConfirm: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sOrderId = oSelectedItem.getTitle();
                this.oSearchModel.setProperty("/searchCriteria/salesOrderId", sOrderId);
                MessageToast.show("Selected: " + sOrderId);
            }
        },

        onSalesOrderDialogCancel: function () {
        },

        onCustomerValueHelp: function () {
            var oDialog = this.byId("customerDialog");
            if (oDialog) {
                oDialog.open();
            } else {
                MessageBox.error("Customer dialog not found.");
            }
        },

        onCustomerDialogSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");
            var aFilters = [];

            if (sValue) {
                aFilters.push(new Filter("CompanyName", FilterOperator.Contains, sValue));
            }

            oBinding.filter(aFilters);
        },

        onCustomerDialogConfirm: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sCustomerName = oSelectedItem.getTitle();
                var sCustomerId = oSelectedItem.getDescription();
                this.oSearchModel.setProperty("/searchCriteria/customerName", sCustomerName);
                this.oSearchModel.setProperty("/searchCriteria/customerId", sCustomerId);
                MessageToast.show("Selected: " + sCustomerName);
            }
        },

        onCustomerDialogCancel: function () {
            // Dialog closes automatically
        },

        onProductValueHelp: function () {
            var oDialog = this.byId("productDialog");
            if (oDialog) {
                oDialog.open();
            } else {
                MessageBox.error("Product dialog not found.");
            }
        },

        onProductDialogSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");
            var aFilters = [];

            if (sValue) {
                var oFilter1 = new Filter("Name", FilterOperator.Contains, sValue);
                var oFilter2 = new Filter("ProductID", FilterOperator.Contains, sValue);
                aFilters.push(new Filter([oFilter1, oFilter2], false));
            }

            oBinding.filter(aFilters);
        },

        onProductDialogConfirm: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sProductName = oSelectedItem.getTitle();
                var sDescription = oSelectedItem.getDescription();
                var sProductId = sDescription ? sDescription.split(" - ")[0] : "";

                this.oSearchModel.setProperty("/searchCriteria/productName", sProductName);
                this.oSearchModel.setProperty("/searchCriteria/productId", sProductId);
                MessageToast.show("Selected: " + sProductName);
            }
        },

        onProductDialogCancel: function () {
            // Dialog closes automatically
        },

        // ============= EXISTING FUNCTIONS (unchanged) =============

        onRegenerateData: function () {
            var that = this;

            MessageBox.confirm(
                "This will regenerate all data in the system. Are you sure you want to continue?",
                {
                    title: "Regenerate All Data",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that._callRegenerateFunction();
                        }
                    }
                }
            );
        },

        _callRegenerateFunction: function () {
            var oModel = this.getView().getModel();
            var that = this;

            this.getView().setBusy(true);

            oModel.callFunction("/RegenerateAllData", {
                method: "POST",
                urlParameters: {
                    NoOfSalesOrders: 50
                },
                success: function (oData, response) {
                    that.getView().setBusy(false);

                    var sMessage = oData && oData.String ? oData.String : "Data regenerated successfully!";
                    MessageToast.show(sMessage);

                    that._refreshTableData();
                },
                error: function (oError) {
                    that.getView().setBusy(false);

                    var sErrorMessage = "Error regenerating data";
                    try {
                        var oErrorData = JSON.parse(oError.responseText);
                        if (oErrorData && oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                            sErrorMessage = oErrorData.error.message.value;
                        }
                    } catch (e) {
                        // Handle parsing error
                    }

                    MessageBox.error(sErrorMessage);
                }
            });
        },

        _refreshTableData: function () {
            this.onClearSearch();

            var oTable = this.byId("salesOrderTable");
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }

            this._updateRecordCount();
        }
    });
});