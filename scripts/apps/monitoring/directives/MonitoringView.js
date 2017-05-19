/**
 * Main monitoring view - list + preview
 *
 * it's a directive so that it can be put together with authoring into some container directive
 */
MonitoringView.$inject = ['$rootScope', 'authoringWorkspace', 'pageTitle', '$timeout'];
export function MonitoringView($rootScope, authoringWorkspace, pageTitle, $timeout) {
    return {
        templateUrl: 'scripts/apps/monitoring/views/monitoring-view.html',
        controller: 'Monitoring',
        controllerAs: 'monitoring',
        scope: {
            type: '=',
            state: '='
        },
        link: function(scope, elem) {
            var containerElem = elem.find('.content-list');

            pageTitle.setUrl(_.capitalize(gettext(scope.type)));

            scope.viewColumn = scope.monitoring.viewColumn;
            scope.shouldRefresh = true;

            /**
             * Toggle viewColumn to switch views between swimlane and list
             */
            scope.displayColumn = function() {
                scope.viewColumn = !scope.viewColumn;
                scope.monitoring.switchView(scope.viewColumn);
                scope.$broadcast('view:column', {viewColumn: scope.viewColumn});
            };

            /**
             * @description Returns true when group's item is selected for previewing, false otherwise.
             * @param {Object} group
             * @returns {Boolean}
             */
            scope.isActiveGroup = function(group) {
                return scope.monitoring.selectedGroup ? scope.monitoring.selectedGroup._id === group._id : true;
            };

            var updateTimeout;

            function handleContainerScroll($event) {
                if ($rootScope.itemToggle) {
                    scope.$applyAsync(() => {
                        $rootScope.itemToggle(false);
                        $rootScope.itemToggle = null;
                    });
                }

                if (scope.viewColumn && containerElem[0].scrollTop === 0) {
                    scope.refreshGroup(scope.group);
                }

                $timeout.cancel(updateTimeout);
                updateTimeout = $timeout(renderIfNeeded, 100, false);
            }

            containerElem.on('scroll', handleContainerScroll);

            function isListEnd(containerElem) {
                return containerElem.scrollTop + containerElem.offsetHeight + 200 >= containerElem.scrollHeight;
            }

            /**
             * Trigger render in case user scrolls to the very end of list
             */
            function renderIfNeeded() {
                if (scope.viewColumn && isListEnd(containerElem[0])) {
                    scheduleFetchNext();
                }
            }

            let fetchNextTimeout;

            /**
             * Schedule content fetchNext after some delay
             */
            function scheduleFetchNext() {
                if (!fetchNextTimeout) {
                    fetchNextTimeout = $timeout(() => {
                        scope.$broadcast('render:next');
                        scope.$applyAsync(() => {
                            fetchNextTimeout = null;
                        });
                    }, 1000, false);
                }
            }

            // force refresh on refresh button click when in specific view such as single, highlights or spiked.
            scope.refreshGroup = function(group) {
                scope.$broadcast('refresh:list', group);
            };

            scope.$on('$destroy', () => {
                containerElem.off();
            });

            scope.$on('$routeUpdate', (event, data) => {
                if (scope.shouldRefresh) {
                    scope.refreshGroup();
                } else {
                    scope.shouldRefresh = true;
                }
            });

            scope.$watch(() => authoringWorkspace.item, (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    scope.shouldRefresh = false; // when item opened or closed
                    if (newValue) { // when item opened
                        scope.monitoring.closePreview();
                    }
                }
            });
        }
    };
}
