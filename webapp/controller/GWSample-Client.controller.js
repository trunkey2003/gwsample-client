/**
 * @fileoverview Sales Order Management Controller
 * @description Controller for managing sales orders with filtering, grouping, and data manipulation capabilities
 * @author SAP UI5 Application Generator
 * @version 1.0.0
 * @namespace ns.gwsampleclient.controller
 */

sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/m/MessageBox", "sap/ui/model/json/JSONModel", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/GroupHeaderListItem"], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator, GroupHeaderListItem) {
    "use strict";

    /**
     * Sales Order Controller Class
     * @class GWSample-Client
     * @extends sap.ui.core.mvc.Controller
     * @description Main controller for managing sales orders with comprehensive filtering, grouping, and CRUD operations
     */
    return Controller.extend("ns.gwsampleclient.controller.GWSample-Client", {

        /**
         * Initializes the controller
         * @function onInit
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Sets up the controller with router, table references, filter models, and initial grouping
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onInit: function () {
            console.log("Initializing Sales Order Controller");

            this.oRouter = this.getOwnerComponent().getRouter(); 
            this.mainTable = this.getView().byId("mainSalesTable");

            var filterData = { 
                searchCriteria: { 
                    salesOrderId: "", 
                    customerName: "", 
                    productName: "", 
                    customerId: "", 
                    productId: "" 
                } 
            };

            this.filterModel = new JSONModel(filterData); 
            this.getView().setModel(this.filterModel, "searchModel");

            this.currentGroupField = "DeliveryStatus";

            this.mainTable.attachEventOnce("updateFinished", this.setupInitialGrouping.bind(this));

            console.log("Controller initialization complete");
        },

        /**
         * Sets up initial grouping by Delivery Status
         * @function setupInitialGrouping
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Applies default grouping by delivery status and updates UI accordingly
         * @private
         * @since 1.0.0
         * @returns {void}
         */
        setupInitialGrouping: function () {
            console.log("Setting up initial grouping by Delivery Status"); 
            this.applyGrouping("DeliveryStatus");

            var deliveryToggle = this.byId("deliveryGroupToggle"); 
            if (deliveryToggle) { 
                deliveryToggle.setPressed(true); 
            }
        }, 

        /**
         * Builds group header for table grouping
         * @function buildGroupHeader
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Creates a group header list item with count and display text for grouped data
         * @param {Object} groupInfo - Group information object containing the group key
         * @param {string} groupInfo.key - The key value for the group
         * @private
         * @since 1.0.0
         * @returns {sap.m.GroupHeaderListItem} Group header list item with formatted title
         */
        buildGroupHeader: function (groupInfo) {
            var groupKey = groupInfo.key; 
            var fieldName = this.currentGroupField; 
            var displayText = groupKey; 
            var itemCount = 0;

            var tableBinding = this.mainTable.getBinding("items"); 
            var dataContexts = tableBinding.getContexts();

            for (var i = 0; i < dataContexts.length; i++) {
                var itemData = dataContexts[i].getObject();

                if (itemData[fieldName] === groupKey) {
                    itemCount++;

                    if (displayText === groupKey) { 
                        switch (fieldName) { 
                            case "DeliveryStatus": 
                                displayText = itemData.DeliveryStatusDescription; 
                                break; 
                            case "BillingStatus": 
                                displayText = itemData.BillingStatusDescription; 
                                break; 
                            default: 
                                displayText = groupKey; 
                        } 
                    }
                }
            }

            return new GroupHeaderListItem({ 
                title: displayText + " (" + itemCount + " orders)", 
                upperCase: false 
            });
        },

        /**
         * Applies search filters to the sales order table
         * @function onSearch
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Processes filter criteria and applies appropriate filtering strategy (standard or product-based)
         * @public
         * @since 1.0.0
         * @fires MessageBox#error - When table or binding is not accessible
         * @fires MessageToast#show - When filters are successfully applied
         * @returns {void}
         */
        onSearch: function () {
            console.log("=== APPLYING FILTERS ===");

            try {
                var mainTable = this.byId("mainSalesTable"); 
                if (!mainTable) { 
                    MessageBox.error("Main table not accessible!"); 
                    return; 
                }

                var filterCriteria = this.filterModel.getProperty("/searchCriteria"); 
                console.log("Filter criteria:", JSON.stringify(filterCriteria));

                var needsProductFilter = (filterCriteria.productId && filterCriteria.productId.trim()) || (filterCriteria.productName && filterCriteria.productName.trim());

                if (needsProductFilter) { 
                    console.log("Product-based filter detected - using expanded search"); 
                    this.executeProductBasedFilter(filterCriteria); 
                    return; 
                }

                var tableBinding = mainTable.getBinding("items"); 
                if (!tableBinding) { 
                    MessageBox.error("Table binding not available!"); 
                    return; 
                }

                var appliedFilters = this.buildStandardFilters(filterCriteria);

                console.log("Applying", appliedFilters.length, "standard filters"); 
                tableBinding.filter(appliedFilters);

                MessageToast.show("Filters applied: " + appliedFilters.length); 
                setTimeout(this.refreshRecordCount.bind(this), 1000);

            } catch (error) { 
                console.error("Error applying filters:", error); 
                MessageBox.error("Filter Error: " + error.message); 
            }
        },

        /**
         * Builds standard filters for sales order and customer criteria
         * @function buildStandardFilters
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Creates filter objects for sales order ID and customer information
         * @param {Object} criteria - Filter criteria object
         * @param {string} criteria.salesOrderId - Sales order ID to filter by
         * @param {string} criteria.customerId - Customer ID to filter by
         * @param {string} criteria.customerName - Customer name to filter by
         * @private
         * @since 1.0.0
         * @returns {sap.ui.model.Filter[]} Array of filter objects
         */
        buildStandardFilters: function (criteria) {
            var filters = [];

            if (criteria.salesOrderId && criteria.salesOrderId.trim()) { 
                filters.push(new Filter("SalesOrderID", FilterOperator.EQ, criteria.salesOrderId.trim())); 
                console.log("Added Sales Order ID filter"); 
            }

            if (criteria.customerId && criteria.customerId.trim()) { 
                filters.push(new Filter("CustomerID", FilterOperator.EQ, criteria.customerId.trim())); 
                console.log("Added Customer ID filter"); 
            } else if (criteria.customerName && criteria.customerName.trim()) { 
                filters.push(new Filter("CustomerName", FilterOperator.Contains, criteria.customerName.trim())); 
                console.log("Added Customer Name filter"); 
            }

            return filters;
        },

        /**
         * Executes product-based filtering using expanded data
         * @function executeProductBasedFilter
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Performs complex filtering that requires expanding line items to filter by product information
         * @param {Object} criteria - Filter criteria object
         * @param {string} [criteria.productId] - Product ID to filter by
         * @param {string} [criteria.productName] - Product name to filter by
         * @param {string} [criteria.salesOrderId] - Sales order ID to filter by
         * @param {string} [criteria.customerId] - Customer ID to filter by
         * @param {string} [criteria.customerName] - Customer name to filter by
         * @private
         * @since 1.0.0
         * @fires MessageBox#error - When product filtering fails
         * @fires MessageToast#show - When product filtering completes
         * @returns {void}
         */
        executeProductBasedFilter: function (criteria) {
            console.log("=== PRODUCT-BASED FILTERING ===");

            var dataModel = this.getView().getModel(); 
            var mainTable = this.byId("mainSalesTable"); 
            var controller = this;

            mainTable.setBusy(true);

            dataModel.read("/SalesOrderSet", {
                urlParameters: ["$expand=ToLineItems"], 
                success: function (responseData) {
                    console.log("Loaded sales orders:", responseData.results.length);

                    var matchingOrders = controller.filterOrdersByProduct(responseData.results, criteria); 
                    console.log("Orders matching criteria:", matchingOrders.length);

                    controller.applyFilteredResults(matchingOrders);

                    mainTable.setBusy(false);

                    var activeFilterCount = controller.countActiveFilters(criteria); 
                    MessageToast.show("Product filter completed. Found " + matchingOrders.length + " orders with " + activeFilterCount + " criteria.");
                }, 
                error: function (error) { 
                    mainTable.setBusy(false); 
                    console.error("Error in product filtering:", error); 
                    MessageBox.error("Product filter failed: " + (error.message || "Unknown error")); 
                }
            });
        },

        /**
         * Filters sales orders by product criteria
         * @function filterOrdersByProduct
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Filters sales orders based on product-specific criteria by examining line items
         * @param {Object[]} salesOrders - Array of sales order objects with expanded line items
         * @param {Object} criteria - Filter criteria object
         * @param {string} [criteria.productId] - Product ID to match in line items
         * @param {string} [criteria.salesOrderId] - Sales order ID to match
         * @param {string} [criteria.customerId] - Customer ID to match
         * @param {string} [criteria.customerName] - Customer name to match (case-insensitive)
         * @private
         * @since 1.0.0
         * @returns {Object[]} Array of filtered sales order objects
         */
        filterOrdersByProduct: function (salesOrders, criteria) {
            var filteredResults = [];

            salesOrders.forEach(function (order) {
                var shouldInclude = true;

                if (criteria.salesOrderId && criteria.salesOrderId.trim()) { 
                    if (order.SalesOrderID !== criteria.salesOrderId.trim()) { 
                        shouldInclude = false; 
                    } 
                }

                if (shouldInclude && criteria.customerId && criteria.customerId.trim()) { 
                    if (order.CustomerID !== criteria.customerId.trim()) { 
                        shouldInclude = false; 
                    } 
                } else if (shouldInclude && criteria.customerName && criteria.customerName.trim()) { 
                    var customerName = order.CustomerName || ""; 
                    if (customerName.toLowerCase().indexOf(criteria.customerName.trim().toLowerCase()) === -1) { 
                        shouldInclude = false; 
                    } 
                }

                if (shouldInclude && criteria.productId && criteria.productId.trim()) {
                    var hasMatchingProduct = false;

                    if (order.ToLineItems && order.ToLineItems.results) { 
                        order.ToLineItems.results.forEach(function (lineItem) { 
                            if (lineItem.ProductID === criteria.productId.trim()) { 
                                hasMatchingProduct = true; 
                            } 
                        }); 
                    }

                    if (!hasMatchingProduct) { 
                        shouldInclude = false; 
                    }
                }

                if (shouldInclude) { 
                    filteredResults.push(order); 
                }
            });

            return filteredResults;
        },

        /**
         * Applies filtered results to the table binding
         * @function applyFilteredResults
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Updates table binding with filtered sales order results
         * @param {Object[]} matchingOrders - Array of sales orders that match filter criteria
         * @private
         * @since 1.0.0
         * @returns {void}
         */
        applyFilteredResults: function (matchingOrders) {
            var mainTable = this.byId("mainSalesTable"); 
            var tableBinding = mainTable.getBinding("items");

            if (matchingOrders.length === 0) {
                // Apply a filter that matches nothing
                tableBinding.filter([new Filter("SalesOrderID", FilterOperator.EQ, "NO_MATCH_FOUND")]);
            } else {
                // Create OR filters for matching order IDs
                var orderIdFilters = []; 
                matchingOrders.forEach(function (order) { 
                    orderIdFilters.push(new Filter("SalesOrderID", FilterOperator.EQ, order.SalesOrderID)); 
                });

                var combinedFilter = new Filter(orderIdFilters, false); 
                tableBinding.filter([combinedFilter]);
            }

            console.log("Applied product filter results"); 
            this.refreshRecordCount();
        },

        /**
         * Counts the number of active filter criteria
         * @function countActiveFilters
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Counts how many filter criteria are currently active/non-empty
         * @param {Object} criteria - Filter criteria object
         * @param {string} criteria.salesOrderId - Sales order ID filter
         * @param {string} criteria.customerId - Customer ID filter
         * @param {string} criteria.customerName - Customer name filter
         * @param {string} criteria.productId - Product ID filter
         * @private
         * @since 1.0.0
         * @returns {number} Number of active filters
         */
        countActiveFilters: function (criteria) { 
            var count = 0; 
            if (criteria.salesOrderId && criteria.salesOrderId.trim()) count++; 
            if (criteria.customerId && criteria.customerId.trim()) count++; 
            else if (criteria.customerName && criteria.customerName.trim()) count++; 
            if (criteria.productId && criteria.productId.trim()) count++; 
            return count; 
        },

        /**
         * Clears all search filters and resets the table
         * @function onClearSearch
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Resets all filter criteria to empty values and removes table filters
         * @public
         * @since 1.0.0
         * @fires MessageBox#error - When clearing filters fails
         * @fires MessageToast#show - When filters are successfully cleared
         * @returns {void}
         */
        onClearSearch: function () {
            console.log("=== CLEARING ALL FILTERS ===");

            try {
                // Reset filter criteria
                this.filterModel.setProperty("/searchCriteria", { 
                    salesOrderId: "", 
                    customerName: "", 
                    productName: "", 
                    customerId: "", 
                    productId: "" 
                });

                console.log("Filter criteria reset");

                var mainTable = this.byId("mainSalesTable"); 
                if (mainTable) { 
                    var tableBinding = mainTable.getBinding("items"); 
                    if (tableBinding) { 
                        tableBinding.filter([]); 
                        console.log("Table filters cleared"); 
                    } 
                }

                MessageToast.show("All filters cleared"); 
                setTimeout(this.refreshRecordCount.bind(this), 1000);

            } catch (error) { 
                console.error("Error clearing filters:", error); 
                MessageBox.error("Clear Error: " + error.message); 
            }
        },

        /**
         * Refreshes the record count display
         * @function refreshRecordCount
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Updates the record count display in the table toolbar
         * @param {number} [customCount] - Optional custom count to display
         * @private
         * @since 1.0.0
         * @returns {void}
         */
        refreshRecordCount: function (customCount) {
            // Implementation for refreshing record count display
        },

        /**
         * Handles sales order item selection and navigation
         * @function onOrderItemSelected
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Navigates to sales order detail view when an item is selected
         * @param {sap.ui.base.Event} event - Selection event containing the selected item
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onOrderItemSelected: function (event) {
            var bindingContext = event.getSource().getBindingContext(); 
            var orderID = bindingContext.getProperty("SalesOrderID");

            this.oRouter.navTo("SalesOrderDetail", { salesOrderId: orderID });
        },

        /**
         * Opens sales order value help dialog
         * @function onSalesOrderValueHelp
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Opens a selection dialog for choosing sales orders
         * @public
         * @since 1.0.0
         * @fires MessageBox#error - When dialog is not found
         * @returns {void}
         */
        onSalesOrderValueHelp: function () { 
            var dialog = this.byId("orderSelectionDialog"); 
            if (dialog) { 
                dialog.open(); 
            } else { 
                MessageBox.error("Order selection dialog not found."); 
            } 
        },

        /**
         * Filters the order selection dialog
         * @function onOrderDialogFilter
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Applies search filter to the order selection dialog
         * @param {sap.ui.base.Event} event - Search event containing the search value
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onOrderDialogFilter: function (event) {
            var searchValue = event.getParameter("value"); 
            var dialogBinding = event.getSource().getBinding("items"); 
            var filters = [];

            if (searchValue) { 
                filters.push(new Filter("SalesOrderID", FilterOperator.Contains, searchValue)); 
            }

            dialogBinding.filter(filters);
        },

        /**
         * Handles order dialog selection acceptance
         * @function onOrderDialogAccept
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Updates filter model with selected order ID
         * @param {sap.ui.base.Event} event - Accept event containing selected item
         * @public
         * @since 1.0.0
         * @fires MessageToast#show - When order is selected
         * @returns {void}
         */
        onOrderDialogAccept: function (event) { 
            var selectedItem = event.getParameter("selectedItem"); 
            if (selectedItem) { 
                var orderID = selectedItem.getTitle(); 
                this.filterModel.setProperty("/searchCriteria/salesOrderId", orderID); 
                MessageToast.show("Selected Order: " + orderID); 
            } 
        },

        /**
         * Handles order dialog cancellation
         * @function onOrderDialogCancel
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Handles cancellation of order selection dialog
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onOrderDialogCancel: function () {
            // Dialog cancellation handling
        },

        /**
         * Opens customer value help dialog
         * @function onCustomerValueHelp
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Opens a selection dialog for choosing customers
         * @public
         * @since 1.0.0
         * @fires MessageBox#error - When dialog is not found
         * @returns {void}
         */
        onCustomerValueHelp: function () { 
            var dialog = this.byId("customerSelectionDialog"); 
            if (dialog) { 
                dialog.open(); 
            } else { 
                MessageBox.error("Customer selection dialog not found."); 
            } 
        },

        /**
         * Filters the customer selection dialog
         * @function onCustomerDialogFilter
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Applies search filter to the customer selection dialog
         * @param {sap.ui.base.Event} event - Search event containing the search value
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onCustomerDialogFilter: function (event) {
            var searchValue = event.getParameter("value"); 
            var dialogBinding = event.getSource().getBinding("items"); 
            var filters = [];

            if (searchValue) { 
                filters.push(new Filter("CompanyName", FilterOperator.Contains, searchValue)); 
            }

            dialogBinding.filter(filters);
        },

        /**
         * Handles customer dialog selection acceptance
         * @function onCustomerDialogAccept
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Updates filter model with selected customer information
         * @param {sap.ui.base.Event} event - Accept event containing selected item
         * @public
         * @since 1.0.0
         * @fires MessageToast#show - When customer is selected
         * @returns {void}
         */
        onCustomerDialogAccept: function (event) { 
            var selectedItem = event.getParameter("selectedItem"); 
            if (selectedItem) { 
                var customerName = selectedItem.getTitle(); 
                var customerID = selectedItem.getDescription(); 
                this.filterModel.setProperty("/searchCriteria/customerName", customerName); 
                this.filterModel.setProperty("/searchCriteria/customerId", customerID); 
                MessageToast.show("Selected Customer: " + customerName); 
            } 
        },

        /**
         * Handles customer dialog cancellation
         * @function onCustomerDialogCancel
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Handles cancellation of customer selection dialog
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onCustomerDialogCancel: function () {
            // Dialog cancellation handling
        },

        /**
         * Opens product value help dialog
         * @function onProductValueHelp
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Opens a selection dialog for choosing products
         * @public
         * @since 1.0.0
         * @fires MessageBox#error - When dialog is not found
         * @returns {void}
         */
        onProductValueHelp: function () { 
            var dialog = this.byId("productSelectionDialog"); 
            if (dialog) { 
                dialog.open(); 
            } else { 
                MessageBox.error("Product selection dialog not found."); 
            } 
        },

        /**
         * Filters the product selection dialog
         * @function onProductDialogFilter
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Applies search filter to the product selection dialog by name or ID
         * @param {sap.ui.base.Event} event - Search event containing the search value
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onProductDialogFilter: function (event) {
            var searchValue = event.getParameter("value"); 
            var dialogBinding = event.getSource().getBinding("items"); 
            var filters = [];

            if (searchValue) { 
                var nameFilter = new Filter("Name", FilterOperator.Contains, searchValue); 
                var idFilter = new Filter("ProductID", FilterOperator.Contains, searchValue); 
                filters.push(new Filter([nameFilter, idFilter], false)); 
            }

            dialogBinding.filter(filters);
        },

        /**
         * Handles product dialog selection acceptance
         * @function onProductDialogAccept
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Updates filter model with selected product information
         * @param {sap.ui.base.Event} event - Accept event containing selected item
         * @public
         * @since 1.0.0
         * @fires MessageToast#show - When product is selected
         * @returns {void}
         */
        onProductDialogAccept: function (event) {
            var selectedItem = event.getParameter("selectedItem"); 
            if (selectedItem) {
                var productName = selectedItem.getTitle(); 
                var description = selectedItem.getDescription(); 
                var productID = description ? description.split(" - ")[0] : "";

                this.filterModel.setProperty("/searchCriteria/productName", productName); 
                this.filterModel.setProperty("/searchCriteria/productId", productID); 
                MessageToast.show("Selected Product: " + productName);
            }
        },

        /**
         * Handles product dialog cancellation
         * @function onProductDialogCancel
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Handles cancellation of product selection dialog
         * @public
         * @since 1.0.0
         * @returns {void}
         */
        onProductDialogCancel: function () {
            // Dialog cancellation handling
        },

        /**
         * Initiates data regeneration process
         * @function onRegenerateData
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Shows confirmation dialog for regenerating system data
         * @public
         * @since 1.0.0
         * @fires MessageBox#confirm - Confirmation dialog for data regeneration
         * @returns {void}
         */
        onRegenerateData: function () {
            var controller = this;

            MessageBox.confirm("This action will regenerate all system data. Do you want to proceed?", { 
                title: "Data Regeneration", 
                onClose: function (action) { 
                    if (action === MessageBox.Action.OK) { 
                        controller.executeDataRegeneration(); 
                    } 
                } 
            });
        },

        /**
         * Executes the data regeneration function
         * @function executeDataRegeneration
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Calls the backend function to regenerate sample data
         * @private
         * @since 1.0.0
         * @fires MessageToast#show - When regeneration is successful
         * @fires MessageBox#error - When regeneration fails
         * @returns {void}
         */
        executeDataRegeneration: function () {
            var dataModel = this.getView().getModel(); 
            var controller = this;

            this.getView().setBusy(true);

            dataModel.callFunction("/RegenerateAllData", {
                method: "POST", 
                urlParameters: { NoOfSalesOrders: 50 }, 
                success: function (data, response) {
                    controller.getView().setBusy(false);

                    var message = data && data.String ? data.String : "Data regeneration completed successfully!"; 
                    MessageToast.show(message);

                    controller.refreshAllData();
                }, 
                error: function (error) {
                    controller.getView().setBusy(false);

                    var errorMessage = "Data regeneration failed"; 
                    try { 
                        var errorData = JSON.parse(error.responseText); 
                        if (errorData && errorData.error && errorData.error.message && errorData.error.message.value) { 
                            errorMessage = errorData.error.message.value; 
                        } 
                    } catch (parseError) {
                        // Keep default error message
                    }

                    MessageBox.error(errorMessage);
                }
            });
        },

        /**
         * Refreshes all data in the view
         * @function refreshAllData
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Clears filters and refreshes table data
         * @private
         * @since 1.0.0
         * @returns {void}
         */
        refreshAllData: function () {
            this.onClearSearch();

            var mainTable = this.byId("mainSalesTable"); 
            if (mainTable) { 
                var tableBinding = mainTable.getBinding("items"); 
                if (tableBinding) { 
                    tableBinding.refresh(); 
                } 
            }

            this.refreshRecordCount();
        },

        /**
         * Handles delivery status grouping toggle
         * @function onDeliveryGroupToggle
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Toggles grouping by delivery status and ensures mutual exclusivity with billing status
         * @param {sap.ui.base.Event} oEvent - Toggle event
         * @public
         * @since 1.0.0
         * @fires MessageToast#show - When grouping is applied or cleared
         * @returns {void}
         */
        onDeliveryGroupToggle: function (oEvent) {
            var bPressed = oEvent.getParameter("pressed");

            if (bPressed) {
                // Clear billing group toggle
                this.byId("billingGroupToggle").setPressed(false);

                this.applyGrouping("DeliveryStatus");

                MessageToast.show("Grouped by Delivery Status");
            } else {
                // If billing toggle is also not pressed, clear grouping
                if (!this.byId("billingGroupToggle").getPressed()) { 
                    this.clearGrouping(); 
                }
            }
        },

        /**
         * Handles billing status grouping toggle
         * @function onBillingGroupToggle
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Toggles grouping by billing status and ensures mutual exclusivity with delivery status
         * @param {sap.ui.base.Event} oEvent - Toggle event
         * @public
         * @since 1.0.0
         * @fires MessageToast#show - When grouping is applied or cleared
         * @returns {void}
         */
        onBillingGroupToggle: function (oEvent) {
            var bPressed = oEvent.getParameter("pressed");

            if (bPressed) {
                // Clear delivery group toggle
                this.byId("deliveryGroupToggle").setPressed(false);

                this.applyGrouping("BillingStatus");

                MessageToast.show("Grouped by Billing Status");
            } else {
                // If delivery toggle is also not pressed, clear grouping
                if (!this.byId("deliveryGroupToggle").getPressed()) { 
                    this.clearGrouping(); 
                }
            }
        },

        /**
         * Clears all grouping from the table
         * @function onClearGrouping
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Removes all grouping and resets toggle buttons
         * @public
         * @since 1.0.0
         * @fires MessageToast#show - When grouping is cleared
         * @returns {void}
         */
        onClearGrouping: function () {
            // Clear all toggle buttons
            this.byId("deliveryGroupToggle").setPressed(false); 
            this.byId("billingGroupToggle").setPressed(false);

            this.clearGrouping();

            MessageToast.show("Grouping cleared");
        },

        /**
         * Applies grouping to the table by specified field
         * @function applyGrouping
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Applies grouping sorter to the table binding for the specified field
         * @param {string} sGroupField - Field name to group by (e.g., "DeliveryStatus", "BillingStatus")
         * @private
         * @since 1.0.0
         * @fires MessageBox#error - When table or binding is not accessible
         * @returns {void}
         */
        applyGrouping: function (sGroupField) {
            try {
                var mainTable = this.byId("mainSalesTable"); 
                if (!mainTable) { 
                    MessageBox.error("Main table not accessible for grouping!"); 
                    return; 
                }

                var tableBinding = mainTable.getBinding("items"); 
                if (!tableBinding) { 
                    MessageBox.error("Table binding not available for grouping!"); 
                    return; 
                }

                this.currentGroupField = sGroupField;

                var groupSorter = new sap.ui.model.Sorter(sGroupField, false, true);

                tableBinding.sort([groupSorter]);

                console.log("Grouping applied successfully by:", sGroupField);

            } catch (error) { 
                console.error("Error applying grouping:", error); 
                MessageBox.error("Grouping Error: " + error.message); 
            }
        },

        /**
         * Clears grouping from the table
         * @function clearGrouping
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Removes all sorting/grouping from the table binding
         * @private
         * @since 1.0.0
         * @fires MessageBox#error - When clearing grouping fails
         * @returns {void}
         */
        clearGrouping: function () {
            try {
                var mainTable = this.byId("mainSalesTable"); 
                if (!mainTable) { 
                    return; 
                }

                var tableBinding = mainTable.getBinding("items"); 
                if (!tableBinding) { 
                    return; 
                }

                this.currentGroupField = null;

                tableBinding.sort([]);

                console.log("Grouping cleared successfully");

            } catch (error) { 
                console.error("Error clearing grouping:", error); 
                MessageBox.error("Clear Grouping Error: " + error.message); 
            }
        },

        /**
         * Alternative buildGroupHeader function with enhanced functionality
         * @function buildGroupHeader
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Creates group headers with item counts and proper display text (duplicate function - consider consolidation)
         * @param {Object} groupInfo - Group information object
         * @param {string} groupInfo.key - The key value for the group
         * @private
         * @since 1.0.0
         * @returns {sap.m.GroupHeaderListItem} Group header with formatted title and count
         * @deprecated This appears to be a duplicate function - consider consolidation
         */
        buildGroupHeader: function (groupInfo) {
            var groupKey = groupInfo.key; 
            var fieldName = this.currentGroupField; 
            var displayText = groupKey; 
            var itemCount = 0;

            if (!fieldName) { 
                return new GroupHeaderListItem({ 
                    title: "Ungrouped Items", 
                    upperCase: false 
                }); 
            }

            var tableBinding = this.mainTable.getBinding("items"); 
            var dataContexts = tableBinding.getContexts();

            for (var i = 0; i < dataContexts.length; i++) {
                var itemData = dataContexts[i].getObject();

                if (itemData[fieldName] === groupKey) {
                    itemCount++;

                    if (displayText === groupKey) { 
                        switch (fieldName) { 
                            case "DeliveryStatus": 
                                displayText = itemData.DeliveryStatusDescription || groupKey; 
                                break; 
                            case "BillingStatus": 
                                displayText = itemData.BillingStatusDescription || groupKey; 
                                break; 
                            default: 
                                displayText = groupKey; 
                        } 
                    }
                }
            }

            return new GroupHeaderListItem({ 
                title: displayText + " (" + itemCount + " orders)", 
                upperCase: false 
            });
        },

        /**
         * Gets statistical information about current grouping
         * @function getGroupingStatistics
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Analyzes current table data and provides grouping statistics
         * @private
         * @since 1.0.0
         * @returns {Object|null} Statistics object containing group data or null if no grouping
         * @returns {Object} returns.groups - Object with group names as keys and statistics as values
         * @returns {number} returns.totalItems - Total number of items
         * @returns {string} returns.groupField - Current grouping field name
         */
        getGroupingStatistics: function () {
            if (!this.currentGroupField) { 
                return null; 
            }

            var mainTable = this.byId("mainSalesTable"); 
            if (!mainTable) { 
                return null; 
            }

            var tableBinding = mainTable.getBinding("items"); 
            if (!tableBinding) { 
                return null; 
            }

            var dataContexts = tableBinding.getContexts(); 
            var groupStats = {}; 
            var totalItems = 0;

            dataContexts.forEach(function (context) {
                var itemData = context.getObject(); 
                var groupKey = itemData[this.currentGroupField]; 
                var displayKey = "";

                switch (this.currentGroupField) { 
                    case "DeliveryStatus": 
                        displayKey = itemData.DeliveryStatusDescription || groupKey; 
                        break; 
                    case "BillingStatus": 
                        displayKey = itemData.BillingStatusDescription || groupKey; 
                        break; 
                    default: 
                        displayKey = groupKey; 
                }

                if (!groupStats[displayKey]) { 
                    groupStats[displayKey] = { 
                        count: 0, 
                        totalValue: 0, 
                        key: groupKey 
                    }; 
                }

                groupStats[displayKey].count++; 
                groupStats[displayKey].totalValue += parseFloat(itemData.GrossAmount) || 0; 
                totalItems++;
            }.bind(this));

            return { 
                groups: groupStats, 
                totalItems: totalItems, 
                groupField: this.currentGroupField 
            };
        },

        /**
         * Displays grouping statistics in a message box
         * @function showGroupingStatistics
         * @memberof ns.gwsampleclient.controller.GWSample-Client
         * @description Shows detailed statistics about current table grouping including counts and totals
         * @public
         * @since 1.0.0
         * @fires MessageBox#information - Shows grouping statistics or no grouping message
         * @returns {void}
         */
        showGroupingStatistics: function () {
            var stats = this.getGroupingStatistics();

            if (!stats) { 
                MessageBox.information("No grouping applied or data available."); 
                return; 
            }

            var message = "Grouping Statistics:\n\n"; 
            message += "Grouped by: " + stats.groupField + "\n"; 
            message += "Total Items: " + stats.totalItems + "\n\n";

            Object.keys(stats.groups).forEach(function (groupName) { 
                var group = stats.groups[groupName]; 
                message += groupName + ": " + group.count + " orders"; 
                message += " (Total Value: " + group.totalValue.toFixed(2) + ")\n"; 
            });

            MessageBox.information(message, { 
                title: "Grouping Statistics" 
            });
        }
    });
});