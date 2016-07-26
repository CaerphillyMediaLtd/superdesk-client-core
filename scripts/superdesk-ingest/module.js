import BaseListController from 'superdesk-archive/controllers/baseList';

(function() {
    'use strict';

    angular.module('superdesk.ingest.send', [
        'superdesk.api',
        'superdesk.desks'
        ])
        .service('send', SendService);

    var app = angular.module('superdesk.ingest', [
        'superdesk.search',
        'superdesk.dashboard',
        'superdesk.widgets.base',
        'superdesk.widgets.ingeststats',
        'superdesk.ingest.send'
    ]);

    app.value('feedingServices', [
        {
            value: 'file',
            label: 'File Feed',
            templateUrl: 'scripts/superdesk-ingest/views/settings/fileConfig.html'
        },
        {
            value: 'reuters_http',
            label: 'Reuters Feed API',
            templateUrl: 'scripts/superdesk-ingest/views/settings/reutersConfig.html',
            config: {
                url: 'http://rmb.reuters.com/rmd/rest/xml',
                auth_url: 'https://commerce.reuters.com/rmd/rest/xml/login'
            }
        },
        {
            value: 'rss',
            label: 'RSS',
            templateUrl: 'scripts/superdesk-ingest/views/settings/rssConfig.html'
        },
        {
            value: 'ftp',
            label: 'FTP',
            templateUrl: 'scripts/superdesk-ingest/views/settings/ftp-config.html',
            config: {passive: true}
        },
        {
            value: 'email',
            label: 'Email',
            templateUrl: 'scripts/superdesk-ingest/views/settings/emailConfig.html'
        }
    ]);

    app.value('feedParsers', [
        {value: 'email_rfc822', name: 'EMail RFC822 Parser'},
        {value: 'nitf', name: 'NITF Parser'},
        {value: 'newsml12', name: 'News ML 1.2 Parser'},
        {value: 'afpnewsml12', name: 'AFP News ML 1.2 Parser'},
        {value: 'newsml2', name: 'News ML-G2 Parser'},
        {value: 'scoop_newsml2', name: 'Scoop Media News ML-G2 Parser'},
        {value: 'wenn', name: 'WENN Parser'},
        {value: 'anpa1312', name: 'ANPA Parser'},
        {value: 'iptc7901', name: 'IPTC 7901 Parser'},
        {value: 'dpa_iptc7901', name: 'DPA IPTC 7901 Parser'},
        {value: 'zczc', name: 'ZCZC Parser'},
        {value: 'ap_anpa1312', name: 'AP ANPA parser'},
        {value: 'text_file', name: 'Text File'},
        {value: 'News Bites', name: 'News Bites'}
    ]);

    var PROVIDER_DASHBOARD_DEFAULTS = {
        show_log_messages: true,
        show_ingest_count: true,
        show_time: true,
        log_messages: 'error',
        show_status: true
    };

    var DEFAULT_SCHEDULE = {minutes: 5, seconds: 0};
    var DEFAULT_IDLE_TIME = {hours: 0, minutes: 0};

    function forcedExtend(dest, src) {
        _.each(PROVIDER_DASHBOARD_DEFAULTS, function(value, key) {
            if (_.has(src, key)) {
                dest[key] = src[key];
            } else {
                dest[key] = PROVIDER_DASHBOARD_DEFAULTS[key];
            }
        });
    }

    IngestProviderService.$inject = ['api', '$q', 'preferencesService', '$filter'];
    function IngestProviderService(api, $q, preferencesService, $filter) {

        var _getAllIngestProviders = function(criteria, page, providers) {
            page = page || 1;
            providers = providers || [];
            criteria = criteria || {};

            return api.query('ingest_providers', _.extend({max_results: 200, page: page}, criteria))
            .then(function(result) {
                providers = providers.concat(result._items);
                if (result._links.next) {
                    page++;
                    return _getAllIngestProviders(criteria, page, providers);
                }
                return $filter('sortByName')(providers);
            });
        };

        var service = {
            providers: null,
            providersLookup: {},
            fetched: null,
            fetchProviders: function() {
                var self = this;
                var providersPromise = $q.all([_getAllIngestProviders(), api.searchProviders.query()]);

                return providersPromise.then(function(results) {
                    self.providers = [];

                    results.forEach(function(result) {
                        self.providers = self.providers.concat(result._items);
                    });
                });
            },
            generateLookup: function() {
                var self = this;

                this.providersLookup = _.indexBy(self.providers, '_id');

                return $q.when();
            },
            initialize: function() {
                if (!this.fetched) {

                    this.fetched = this.fetchProviders()
                        .then(angular.bind(this, this.generateLookup));
                }

                return this.fetched;
            },
            fetchAllIngestProviders: function(criteria) {
                return _getAllIngestProviders(criteria);
            },
            fetchDashboardProviders: function() {
                var deferred = $q.defer();
                _getAllIngestProviders().then(function (result) {
                    var ingest_providers = result;
                    preferencesService.get('dashboard:ingest').then(function(user_ingest_providers) {
                        if (!_.isArray(user_ingest_providers)) {
                            user_ingest_providers = [];
                        }

                        _.forEach(ingest_providers, function(provider) {
                            var user_provider = _.find(user_ingest_providers, function(item) {
                                return item._id === provider._id;
                            });

                            provider.dashboard_enabled = user_provider?true:false;
                            forcedExtend(provider, user_provider?user_provider:PROVIDER_DASHBOARD_DEFAULTS);
                        });

                        deferred.resolve(ingest_providers);
                    }, function (error) {
                        deferred.reject(error);
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }
        };
        return service;
    }

    SubjectService.$inject = ['api'];
    function SubjectService(api) {
        var service = {
            rawSubjects: null,
            qcodeLookup: {},
            subjects: [],
            fetched: null,
            fetchSubjects: function() {
                var self = this;

                return api.get('/subjectcodes')
                .then(function(result) {
                    self.rawSubjects = result;
                });
            },
            process: function() {
                var self = this;

                _.each(this.rawSubjects._items, function(item) {
                    self.qcodeLookup[item.qcode] = item;
                });
                _.each(this.rawSubjects._items, function(item) {
                    self.subjects.push({qcode: item.qcode, name: item.name, path: self.getPath(item)});
                });

                return this.subjects;
            },
            getPath: function(item) {
                var path = '';
                if (item.parent) {
                    path = this.getPath(this.qcodeLookup[item.parent]) + this.qcodeLookup[item.parent].name + ' / ';
                }
                return path;
            },
            initialize: function() {
                if (!this.fetched) {
                    this.fetched = this.fetchSubjects()
                        .then(angular.bind(this, this.process));
                }
                return this.fetched;
            }
        };
        return service;
    }

    class IngestListController extends BaseListController {
        constructor($scope, $injector, $location, api, $rootScope, search, desks) {
            super($scope, $location, search, desks);

            $scope.type = 'ingest';
            $scope.loading = false;
            $scope.repo = {
                ingest: true,
                archive: false
            };
            $scope.api = api.ingest;
            $rootScope.currentModule = 'ingest';

            this.fetchItems = function(criteria, next) {
                $scope.loading = true;
                criteria.aggregations = 1;
                api.query('ingest', criteria).then(function(items) {
                    $scope.items = search.mergeItems(items, $scope.items, next);
                    $scope.total = items._meta.total;
                })
                ['finally'](function() {
                    $scope.loading = false;
                });
            };

            this.fetchItem = function(id) {
                return api.ingest.getById(id);
            };

            var oldQuery = _.omit($location.search(), '_id');
            var update = angular.bind(this, function searchUpdated() {
                var newquery = _.omit($location.search(), '_id');
                if (!_.isEqual(_.omit(newquery, 'page'), _.omit(oldQuery, 'page'))) {
                    $location.search('page', null);
                }
                var query = this.getQuery($location.search());
                this.fetchItems({source: query});
                oldQuery = newquery;
            });

            $scope.$on('ingest:update', update);
            $scope.$on('item:fetch', update);
            $scope.$on('item:deleted', update);
            $scope.$watchCollection(function getSearchWithoutId() {
                return _.omit($location.search(), '_id');
            }, update);
        }
    }

    IngestListController.$inject = ['$scope', '$injector', '$location', 'api', '$rootScope', 'search', 'desks'];

    IngestSettingsController.$inject = ['$scope', 'privileges'];
    function IngestSettingsController($scope, privileges) {
        var user_privileges = privileges.privileges;

        $scope.showIngest   = Boolean(user_privileges.ingest_providers);
        $scope.showRuleset  = Boolean(user_privileges.rule_sets);
        $scope.showRouting  = Boolean(user_privileges.routing_rules);
    }

    PieChartDashboardDirective.$inject = ['colorSchemes'];
    function PieChartDashboardDirective(colorSchemes) {
        return {
            replace: true,
            scope: {
                terms: '=',
                theme: '@',
                colors: '='
            },
            link: function(scope, element, attrs) {

                var appendTarget = element[0];
                var horizBlocks = attrs.x ? parseInt(attrs.x, 10) : 1;
                var vertBlocks  = attrs.y ? parseInt(attrs.y, 10) : 1;

                var graphSettings = {       //thightly depends on CSS
                    blockWidth: 300,
                    blockHeight: 197,
                    mergeSpaceLeft: 60,     //30 + 2 + 20
                    mergeSpaceBottom: 99    //30 + 2 + 20 + 47
                };

                var width = graphSettings.blockWidth * horizBlocks + graphSettings.mergeSpaceLeft * (horizBlocks - 1),
                    height = graphSettings.blockHeight * vertBlocks + graphSettings.mergeSpaceBottom * (vertBlocks - 1),
                    radius = Math.min(width, height) / 2;

                colorSchemes.get(function(colorsData) {

                    var colorScheme = colorsData.schemes[0];

                    var arc = d3.svg.arc()
                        .outerRadius(radius)
                        .innerRadius(radius * 8 / 13 / 2);

                    var sort = attrs.sort || null;
                    var pie = d3.layout.pie()
                        .value(function(d) { return d.doc_count; })
                        .sort(sort ? function(a, b) { return d3.ascending(a[sort], b[sort]); } : null);

                    var svg = d3.select(appendTarget).append('svg')
                        .attr('width', width)
                        .attr('height', height)
                        .append('g')
                        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

                    scope.$watchGroup(['terms', 'colors'], function renderData(newData) {
                        if (newData[0] != null) {

                            if (newData[1] !== null) {
                                colorScheme = colorsData.schemes[_.findKey(colorsData.schemes, {name: newData[1]})];
                            }

                            var colorScale = d3.scale.ordinal()
                                .range(colorScheme.charts);

                            svg.selectAll('.arc').remove();

                            var g = svg.selectAll('.arc')
                                .data(pie(newData[0]))
                                .enter().append('g')
                                .attr('class', 'arc');

                            g.append('path')
                                .attr('d', arc)
                                .style('fill', function(d) { return colorScale(d.data.key); });

                            g.append('text')
                                .attr('class', 'place-label')
                                .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; })
                                .style('text-anchor', 'middle')
                                .style('fill', colorScheme.text)
                                .text(function(d) { return d.data.key; });

                            arrangeLabels();
                        }

                    });
                    function arrangeLabels() {
                        var move = 1;
                        while (move > 0) {
                            move = 0;
                            svg.selectAll('.place-label')
                                    .each(rerangeLabels);
                        }
                        function rerangeLabels() {
                            /*jshint validthis: true */
                            var self = this,
                                    a = self.getBoundingClientRect();

                            svg.selectAll('.place-label')
                                    .each(function () {
                                        if (this !== self) {
                                            var b = this.getBoundingClientRect();
                                            if ((Math.abs(a.left - b.left) * 2 < (a.width + b.width)) &&
                                                    (Math.abs(a.top - b.top) * 2 < (a.height + b.height))) {

                                                var dx = (Math.max(0, a.right - b.left) +
                                                        Math.min(0, a.left - b.right)) * 0.01,
                                                        dy = (Math.max(0, a.bottom - b.top) +
                                                                Math.min(0, a.top - b.bottom)) * 0.02,
                                                        tt = d3.transform(d3.select(this).attr('transform')),
                                                        to = d3.transform(d3.select(self).attr('transform'));
                                                move += Math.abs(dx) + Math.abs(dy);
                                                to.translate = [to.translate[0] + dx, to.translate[1] + dy];
                                                tt.translate = [tt.translate[0] - dx, tt.translate[1] - dy];
                                                d3.select(this).attr('transform', 'translate(' + tt.translate + ')');
                                                d3.select(self).attr('transform', 'translate(' + to.translate + ')');
                                                a = this.getBoundingClientRect();
                                            }
                                        }
                                    });
                        }
                    }
                });
            }
        };
    }

    IngestSourcesContent.$inject = ['feedingServices', 'feedParsers', 'gettext', 'notify', 'api', '$location',
                                    'modal', '$filter'];
    function IngestSourcesContent(feedingServices, feedParsers, gettext, notify, api, $location, modal, $filter) {
        return {
            templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-sources-content.html',
            link: function($scope) {
                $scope.provider = null;
                $scope.origProvider = null;

                $scope.feedingServices = $filter('sortByName')(feedingServices, 'label');
                $scope.feedParsers = $filter('sortByName')(feedParsers);
                $scope.fileTypes = ['text', 'picture', 'composite', 'video', 'audio'];
                $scope.minutes = [0, 1, 2, 3, 4, 5, 8, 10, 15, 30, 45];
                $scope.seconds = [0, 5, 10, 15, 30, 45];
                $scope.hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

                // a list of all data field names in retrieved content
                // expected by the server
                // XXX: have this somewhere in config? probably better
                $scope.contentFields = [
                    'body_text', 'guid', 'published_parsed',
                    'summary', 'title', 'updated_parsed'
                ];

                // a list of data field names currently *not* selected in any
                // of the dropdown menus in the field aliases section
                $scope.fieldsNotSelected = angular.copy($scope.contentFields);

                // a list of field names aliases - used for fields in retrieved
                // content whose names differ from what the server expects
                $scope.fieldAliases = [];

                function fetchProviders() {
                    return api.ingestProviders.query({max_results: 200})
                        .then(function(result) {
                            result._items = $filter('sortByName')(result._items);
                            $scope.providers = result;
                        });
                }

                function openProviderModal() {
                    var provider_id = $location.search()._id;
                    var provider;
                    if (provider_id) {
                        if ($scope.providers && $scope.providers._items) {
                            provider = _.find($scope.providers._items, function (item) {
                                return item._id === provider_id;
                            });
                        }

                        if (provider == null) {
                            api.ingestProviders.getById(provider_id).then(function (result) {
                                provider = result;
                            });
                        }

                        if (provider) {
                            $scope.edit(provider);
                        }
                    }
                }

                fetchProviders().then(function() {
                    openProviderModal();
                });

                api('rule_sets').query().then(function(result) {
                    $scope.rulesets = $filter('sortByName')(result._items);
                });

                api('routing_schemes').query().then(function(result) {
                    $scope.routingScheme = $filter('sortByName')(result._items);
                });

                $scope.fetchSourceErrors = function() {
                    if ($scope.provider && $scope.provider.feeding_service) {
                        return api('io_errors').query({'source_type': $scope.provider.feeding_service})
                            .then(function (result) {
                                $scope.provider.source_errors = result._items[0].source_errors;
                                $scope.provider.all_errors = result._items[0].all_errors;
                            });
                    }
                };

                $scope.remove = function(provider) {
                    modal.confirm(gettext('Are you sure you want to delete Ingest Source?')).then(
                        function removeIngestProviderChannel() {
                            api.ingestProviders.remove(provider)
                                .then(
                                    function () {
                                        notify.success(gettext('Ingest Source deleted.'));
                                    },
                                    function(response) {
                                        if (angular.isDefined(response.data._message)) {
                                            notify.error(response.data._message);
                                        } else {
                                            notify.error(gettext('Error: Unable to delete Ingest Source'));
                                        }
                                    }
                                ).then(fetchProviders);
                        }
                    );
                };

                $scope.edit = function(provider) {
                    var aliases;

                    $scope.origProvider = provider || {};
                    $scope.provider = _.create($scope.origProvider);
                    $scope.provider.update_schedule = $scope.origProvider.update_schedule || DEFAULT_SCHEDULE;
                    $scope.provider.idle_time = $scope.origProvider.idle_time || DEFAULT_IDLE_TIME;
                    $scope.provider.notifications = $scope.origProvider.notifications;
                    $scope.provider.config = $scope.origProvider.config;
                    $scope.provider.critical_errors = $scope.origProvider.critical_errors;
                    $scope.provider._id = $scope.origProvider._id;
                    $scope.provider.content_types = $scope.origProvider.content_types;

                    // init the lists of field aliases and non-selected fields
                    $scope.fieldAliases = [];
                    aliases = (angular.isDefined($scope.origProvider.config) && $scope.origProvider.config.field_aliases) || [];

                    var aliasObj = {};
                    aliases.forEach(function (item) {
                        _.extend(aliasObj, item);
                    });

                    Object.keys(aliasObj).forEach(function (fieldName) {
                        $scope.fieldAliases.push(
                            {fieldName: fieldName, alias: aliasObj[fieldName]});
                    });

                    $scope.fieldsNotSelected = $scope.contentFields.filter(
                        function (fieldName) {
                            return !(fieldName in aliasObj);
                        }
                    );
                };

                $scope.cancel = function() {
                    $scope.origProvider = null;
                    $scope.provider = null;
                };

                $scope.setConfig = function(provider) {
                    $scope.provider.config = provider.config;
                };

                /**
                * Updates provider configuration object. It also clears the
                * username and password fields, if authentication is not
                * needed for an RSS source.
                *
                * @method setRssConfig
                * @param {Object} provider - ingest provider instance
                */
                $scope.setRssConfig = function (provider) {
                    if (!provider.config.auth_required) {
                        provider.config.username = null;
                        provider.config.password = null;
                    }
                    $scope.provider.config = provider.config;
                };

                /**
                * Appends a new (empty) item to the list of field aliases.
                *
                * @method addFieldAlias
                */
                $scope.addFieldAlias = function () {
                    $scope.fieldAliases.push({fieldName: null, alias: ''});
                };

                /**
                * Removes a field alias from the list of field aliases at the
                * specified index.
                *
                * @method removeFieldAlias
                * @param {Number} itemIdx - index of the item to remove
                */
                $scope.removeFieldAlias = function (itemIdx) {
                    var removed = $scope.fieldAliases.splice(itemIdx, 1);
                    if (removed[0].fieldName) {
                        $scope.fieldsNotSelected.push(removed[0].fieldName);
                    }
                };

                /**
                * Updates the list of content field names not selected in any
                * of the dropdown menus.
                *
                * @method fieldSelectionChanged
                */
                $scope.fieldSelectionChanged = function () {
                    var selectedFields = {};

                    $scope.fieldAliases.forEach(function (item) {
                        if (item.fieldName) {
                            selectedFields[item.fieldName] = true;
                        }
                    });

                    $scope.fieldsNotSelected = $scope.contentFields.filter(
                        function (fieldName) {
                            return !(fieldName in selectedFields);
                        }
                    );
                };

                /**
                * Calculates a list of content field names that can be used as
                * options in a dropdown menu.
                *
                * The list is comprised of all field names that are currently
                * not selected in any of the other dropdown menus and
                * of a field name that should be selected in the current
                * dropdown menu (if any).
                *
                * @method availableFieldOptions
                * @param {String} [selectedName] - currently selected field
                * @return {String[]} list of field names
                */
                $scope.availableFieldOptions = function (selectedName) {
                    var fieldNames = angular.copy($scope.fieldsNotSelected);

                    // add current field selection, if available
                    if (selectedName) {
                        fieldNames.push(selectedName);
                    }
                    return fieldNames;
                };

                $scope.save = function() {
                    var newAliases = [];

                    $scope.fieldAliases.forEach(function (item) {
                        if (item.fieldName && item.alias) {
                            var newAlias = {};
                            newAlias[item.fieldName] = item.alias;
                            newAliases.push(newAlias);
                        }
                    });

                    if (typeof($scope.provider.config) !== 'undefined') {
                        $scope.provider.config.field_aliases = newAliases;
                    }
                    delete $scope.provider.all_errors;
                    delete $scope.provider.source_errors;

                    api.ingestProviders.save($scope.origProvider, $scope.provider)
                    .then(function() {
                        notify.success(gettext('Provider saved!'));
                        $scope.cancel();
                    }).then(fetchProviders);
                };

                $scope.gotoIngest = function(source) {
                    $location.path('/search').search({'repo': 'ingest', 'source': angular.toJson([source])});
                };

                /**
                 * Add or remove the current 'fileType' from the provider.
                 *
                 * @param {string} fileType
                 */
                $scope.addOrRemoveFileType = function(fileType) {
                    if (!$scope.provider.content_types) {
                        $scope.provider.content_types = [];
                    }

                    var index = $scope.provider.content_types.indexOf(fileType);
                    if (index > -1) {
                        $scope.provider.content_types.splice(index, 1);
                    } else {
                        $scope.provider.content_types.push(fileType);
                    }
                };

                /**
                 * Return true if the 'fileType' is in provider.content_types list.
                 *
                 * @param {string} fileType
                 * @return boolean
                 */
                $scope.hasFileType = function(fileType) {
                    return $scope.provider && $scope.provider.content_types &&
                        $scope.provider.content_types.indexOf(fileType) > -1;
                };

                /**
                 * Initializes the configuration for the selected feeding service if the config is not defined.
                 */
                $scope.initProviderConfig = function () {
                    var service = getCurrentService();
                    if (service && service.config) {
                        $scope.provider.config = angular.extend({}, service.config);
                    } else {
                        $scope.provider.config = {};
                    }
                };

                /**
                 * Returns the templateURL for the selected feeding service.
                 * @returns {string}
                 */
                $scope.getConfigTemplateURL = function() {
                    var feedingService = getCurrentService();
                    return feedingService ? feedingService.templateUrl : '';
                };

                function getCurrentService() {
                    return _.find($scope.feedingServices, {value: $scope.provider.feeding_service});
                }
            }
        };
    }

    IngestRulesContent.$inject = ['api', 'gettext', 'notify', 'modal', '$filter'];
    function IngestRulesContent(api, gettext, notify, modal, $filter) {
        return {
            templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-rules-content.html',
            link: function(scope) {

                var _orig = null;
                scope.editRuleset = null;

                api('rule_sets').query().then(function(result) {
                    scope.rulesets = $filter('sortByName')(result._items);
                });

                scope.edit = function(ruleset) {
                    scope.editRuleset = _.create(ruleset);
                    scope.editRuleset.rules = ruleset.rules || [];
                    _orig = ruleset;
                };

                scope.save = function(ruleset) {
                    var _new = ruleset._id ? false : true;
                    api('rule_sets').save(_orig, ruleset)
                    .then(function() {
                        if (_new) {
                            scope.rulesets.push(_orig);
                        }

                        scope.rulesets = $filter('sortByName')(scope.rulesets);
                        notify.success(gettext('Rule set saved.'));
                        scope.cancel();
                    }, function(response) {
                        notify.error(gettext('I\'m sorry but there was an error when saving the rule set.'));
                    });
                };

                scope.cancel = function() {
                    scope.editRuleset = null;
                };

                scope.remove = function(ruleset) {
                    confirm().then(function() {
                        api('rule_sets').remove(ruleset)
                        .then(function(result) {
                            _.remove(scope.rulesets, ruleset);
                        }, function(response) {
                            if (angular.isDefined(response.data._message)) {
                                notify.error(gettext('Error: ' + response.data._message));
                            } else {
                                notify.error(gettext('There was an error. Rule set cannot be deleted.'));
                            }
                        });
                    });
                };

                function confirm() {
                    return modal.confirm(gettext('Are you sure you want to delete rule set?'));
                }

                scope.removeRule = function(rule) {
                    _.remove(scope.editRuleset.rules, rule);
                };

                scope.addRule = function() {
                    if (!scope.editRuleset.rules) {
                        scope.editRuleset.rules = [];
                    }
                    scope.editRuleset.rules.push({old: null, 'new': null});
                };

                scope.reorder = function(start, end) {
                    scope.editRuleset.rules.splice(end, 0, scope.editRuleset.rules.splice(start, 1)[0]);
                };
            }
        };
    }

    /**
     * @memberof superdesk.ingest
     * @ngdoc directive
     * @name sdIngestRoutingContent
     * @description
     *   Creates the main page for adding or editing routing rules (in the
     *   modal for editing ingest routing schemes).
     */
    IngestRoutingContent.$inject = ['api', 'gettext', 'notify', 'modal', 'contentFilters', '$filter'];
    function IngestRoutingContent(api, gettext, notify, modal, contentFilters, $filter) {
        return {
            templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-routing-content.html',
            link: function(scope) {
                var filtersStartPage = 1,  // the fetch results page to start from
                    _orig = null;

                scope.editScheme = null;
                scope.rule = null;
                scope.ruleIndex = null;
                scope.schemes = [];
                scope.contentFilters = [];

                function initSchemes() {
                    api('routing_schemes').query().then(function(result) {
                        scope.schemes = $filter('sortByName')(result._items);
                    });

                    contentFilters.getAllContentFilters(
                        filtersStartPage, scope.contentFilters
                    )
                    .then(function (filters) {
                        scope.contentFilters = filters;
                    });
                }

                initSchemes();

                function confirm(context) {
                    if (context === 'scheme') {
                        return modal.confirm(gettext('Are you sure you want to delete this scheme?'));
                    } else if (context === 'rule') {
                        return modal.confirm(gettext('Are you sure you want to delete this scheme rule?'));
                    }
                }

                scope.edit = function(scheme) {
                    scope.editScheme = _.clone(scheme);
                    scope.editScheme.rules = _.clone(scheme.rules || []);
                    _orig = scheme;
                };

                scope.save = function() {
                    if (scope.rule) {

                        if (scope.ruleIndex === -1) {
                            scope.editScheme.rules.push(scope.rule);
                        } else {
                            scope.editScheme.rules[scope.ruleIndex] = scope.rule;
                        }
                    }

                    scope.editScheme.rules = _.reject(scope.editScheme.rules, {name: null});

                    _.forEach(scope.editScheme.rules, function(r) {
                        // filterName was only needed to display it in the UI
                        delete r.filterName;
                    });

                    var _new = scope.editScheme._id ? false : true;
                    api('routing_schemes').save(_orig, scope.editScheme)
                    .then(function() {
                        if (_new) {
                            scope.schemes.push(_orig);
                        }
                        scope.schemes = $filter('sortByName')(scope.schemes);
                        notify.success(gettext('Routing scheme saved.'));
                        scope.cancel();
                    }, function(response) {
                        notify.error(gettext('I\'m sorry but there was an error when saving the routing scheme.'));
                    });
                };

                scope.cancel = function () {
                    scope.editScheme = null;
                    scope.rule = null;
                    scope.ruleIndex = null;
                    scope.schemes = [];
                    scope.contentFilters = [];
                    initSchemes();
                };

                scope.remove = function(scheme) {
                    confirm('scheme').then(function() {
                        api('routing_schemes').remove(scheme)
                        .then(function(result) {
                            _.remove(scope.schemes, scheme);
                        }, function(response) {
                            if (angular.isDefined(response.data._message)) {
                                notify.error(gettext('Error: ' + response.data._message));
                            } else {
                                notify.error(gettext('There was an error. Routing scheme cannot be deleted.'));
                            }
                        });
                    });
                };

                scope.removeRule = function(rule) {
                    confirm('rule').then(function() {
                        if (rule === scope.rule) {
                            scope.rule = null;
                        }
                        _.remove(scope.editScheme.rules, rule);
                    });
                };

                scope.addRule = function() {
                    var rule = {
                        name: null,
                        filter: null,
                        actions: {
                            fetch: [],
                            publish: [],
                            exit: false
                        },
                        schedule: {
                            day_of_week: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
                            hour_of_day_from: '00:00:00',
                            hour_of_day_to: '23:55:00'
                        }
                    };
                    scope.editScheme.rules.push(rule);
                    scope.editRule(rule);
                };

                /**
                 * Opens the given routing scheme rule for editing.
                 *
                 * @method editRule
                 * @param {Object} rule - routing scheme rule's config data
                 */
                scope.editRule = function (rule) {
                    var filter;

                    scope.rule = rule;

                    filter = _.find(scope.contentFilters, {_id: rule.filter});
                    if (filter) {
                        // filterName needed to display it in the UI
                        scope.rule.filterName = filter.name;
                    }
                };

                scope.reorder = function(start, end) {
                    scope.editScheme.rules.splice(end, 0, scope.editScheme.rules.splice(start, 1)[0]);
                };
            }
        };
    }

    IngestRoutingGeneral.$inject = ['weekdays', 'desks', 'macros'];
    function IngestRoutingGeneral(weekdays, desks, macros) {
        return {
            scope: {
                rule: '=',
                removeAction: '='
            },
            templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-routing-general.html',
            link: function(scope) {
                scope.dayLookup = weekdays;
                scope.macroLookup = {};

                desks.initialize()
                .then(function() {
                    scope.deskLookup = desks.deskLookup;
                    scope.stageLookup = desks.stageLookup;
                });

                scope.remove = function() {
                    if (typeof scope.removeAction === 'function') {
                        return scope.removeAction(scope.rule);
                    }
                };

                macros.get().then(function(macros) {
                    _.transform(macros, function(lookup, macro, idx) {
                        scope.macroLookup[macro.name] = macro;
                    });
                });
            }
        };
    }

    /**
     * @memberof superdesk.ingest
     * @ngdoc directive
     * @name sdIngestRoutingFilter
     * @description
     *   Creates the Filter tab used for defining a content filter for routing
     *   rules (found in the modal for editing ingest routing schemes).
     */
    IngestRoutingFilter.$inject = [];
    function IngestRoutingFilter() {

        /**
         * Creates an utility method on the built-in RegExp object used for
         * escaping arbitrary strings so that they can be safely used in
         * dynamically created regular expressions patterns.
         *
         * The idea is to find all characters in the given string that have a
         * special meaning in regex definition, and replace them with their
         * escaped versions. For example:
         *     '^' becomes '\\^', '*' becomes '\\*', etc.
         *
         * Usage example (creating a new regex pattern):
         *
         *     var regex = new RegExp(RegExp.escape(unsafeString));
         *
         * Taken from http://stackoverflow.com/a/3561711/5040035
         *
         * @method escape
         * @param {string} s - the string to escape
         * @return {string} - an escaped version of the given string
         */
        // XXX: should probably be moved into some utils module - but where?
        RegExp.escape = function (s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        };

        return {
            scope: {
                rule: '=',
                filters: '=contentFilters'
            },
            templateUrl: 'scripts/superdesk-ingest/views/settings' +
                         '/ingest-routing-filter.html',
            link: function(scope) {
                var currFilter;

                function init() {
                    scope.matchingFilters = [];  // used for filter search
                    scope.filterSearchTerm = null;

                    currFilter = _.find(scope.filters, {_id: scope.rule.filter});
                    if (currFilter) {
                        scope.selectedFilter = currFilter;
                    } else {
                        scope.selectedFilter = null;
                    }
                }

                init();

                scope.$watch('rule', function() {
                    init();
                });

                /**
                 * Finds a subset of all content filters whose names contain
                 * the given search term. The search is case-insensitive.
                 * As a result, the matchingFilters list is updated.
                 *
                 * @method searchFilters
                 * @param {string} term - the string to search for
                 */
                scope.searchFilters = function (term) {
                    var regex = new RegExp(RegExp.escape(term), 'i');

                    scope.matchingFilters = _.filter(
                        scope.filters,
                        function (filter) {
                            return regex.test(filter.name);
                        }
                    );
                };

                /**
                 * Sets the given filter as the content filter for the routing
                 * rule.
                 *
                 * @method selectFilter
                 * @param {Object} filter - the content filter to select
                 */
                scope.selectFilter = function (filter) {
                    scope.selectedFilter = filter;
                    scope.rule.filter = filter._id;
                    scope.rule.filterName = filter.name;
                    scope.filterSearchTerm = null;
                };

                /**
                 * Clears the routing rule's content filter.
                 *
                 * @method clearSelectedFilter
                 */
                scope.clearSelectedFilter = function () {
                    scope.selectedFilter = null;
                    scope.rule.filter = null;
                    scope.rule.filterName = null;
                };
            }
        };
    }

    IngestRoutingAction.$inject = ['desks', 'macros', 'subscribersService', 'metadata', 'gettext'];
    function IngestRoutingAction(desks, macros, subscribersService, metadata, gettext) {
        return {
            scope: {rule: '='},
            templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-routing-action.html',
            link: function(scope) {
                scope.newFetch = {};
                scope.newPublish = {};
                scope.deskLookup = {};
                scope.stageLookup = {};
                scope.macroLookup = {};
                scope.customSubscribers = [];
                scope.target_types = [];

                desks.initialize()
                .then(function() {
                    scope.deskLookup = desks.deskLookup;
                    scope.stageLookup = desks.stageLookup;
                });

                macros.get(true).then(function(macros) {
                    _.transform(macros, function(lookup, macro, idx) {
                        scope.macroLookup[macro.name] = macro;
                    });
                });

                subscribersService.fetchActiveSubscribers().then(function(items) {
                    scope.customSubscribers = [];
                    _.each(items, function(item) {
                        scope.customSubscribers.push({'_id': item._id, 'name': item.name});
                    });
                });

                metadata.initialize()
                    .then(function() {
                        scope.target_types = metadata.values.subscriberTypes;
                    });

                scope.getActionString = function(action) {
                    if (scope.deskLookup[action.desk] && scope.stageLookup[action.stage]) {
                        var actionValues = [];
                        actionValues.push(scope.deskLookup[action.desk].name);
                        actionValues.push(scope.stageLookup[action.stage].name);
                        if (action.macro) {
                            actionValues.push(scope.macroLookup[action.macro].label);
                        } else {
                            actionValues.push(' - ');
                        }
                        if (action.target_subscribers && action.target_subscribers.length > 0) {
                            actionValues.push(_.map(action.target_subscribers, 'name').join(','));
                        } else {
                            actionValues.push(' - ');
                        }
                        if (action.target_types && action.target_types.length > 0) {
                            var targets = [];
                            _.forEach(action.target_types, function(target_type) {
                                targets.push((!target_type.deny ? gettext('Not ') : '') + target_type.name);
                            });
                            actionValues.push(targets.join(','));
                        }

                        return actionValues.join(' / ');
                    }
                };

                scope.addFetch = function() {
                    if (scope.newFetch.desk && scope.newFetch.stage) {
                        scope.rule.actions.fetch.push(scope.newFetch);
                        scope.newFetch = {};
                    }
                };

                scope.removeFetch = function(fetchAction) {
                    _.remove(scope.rule.actions.fetch, function(f) {
                        return f === fetchAction;
                    });
                };

                scope.addPublish = function() {
                    if (scope.newPublish.desk && scope.newPublish.stage) {
                        scope.rule.actions.publish.push(scope.newPublish);
                        scope.newPublish = {};
                        scope.newPublish.target_subscribers = [];
                        scope.newPublish.target_types = [];
                    }
                };

                scope.removePublish = function(publishAction) {
                    _.remove(scope.rule.actions.publish, function(p) {
                        return p === publishAction;
                    });
                };
            }
        };
    }

    /**
     * @memberof superdesk.ingest
     * @ngdoc directive
     * @name sdIngestRoutingSchedule
     * @description
     *   Creates the Schedule section (tab) of the routing rule edit form.
     */
    IngestRoutingSchedule.$inject = ['tzdata'];
    function IngestRoutingSchedule(tzdata) {
        return {
            scope: {
                rule: '='  // the routing rule whose schedule is being edited
            },
            templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-routing-schedule.html',
            link: function (scope, element, attrs) {}
        };
    }

    function SortRulesDirectives() {
        return {
            link:function(scope, element) {
                element.sortable({
                    items: 'li',
                    connectWith: '.rule-list',
                    cursor: 'move',
                    start: function(event, ui) {
                        ui.item.data('start', ui.item.index());
                    },
                    stop: function(event, ui) {
                        var start = ui.item.data('start'), end = ui.item.index();
                        scope.reorder(start, end);
                        scope.$apply();
                    }
                });
            }
        };
    }

    function InsertFilter() {
        return function(input, location, addition) {
            location = location || input.length;
            addition = addition || '';

            return input.substr(0, location) + addition + input.substr(location);
        };
    }

    IngestDashboardController.$inject = ['$scope', 'api', 'ingestSources', 'preferencesService', 'notify', 'gettext'];
    function IngestDashboardController($scope, $api, ingestSources, preferencesService, notify, gettext) {
        $scope.items = [];
        $scope.dashboard_items = [];

        $scope.fetchItems = function () {
            ingestSources.fetchDashboardProviders().then(function(result) {
                $scope.items = result;
                $scope.dashboard_items =  _.filter(result, {'dashboard_enabled': true});
            });
        };

        $scope.setUserPreferences = function(refresh) {
            var preferences = [];
            var update = {};

            _.forEach(_.filter($scope.items, {'dashboard_enabled': true}),
                function (item) {
                    preferences.push(_.pick(item, _.union(['_id'], _.keys(PROVIDER_DASHBOARD_DEFAULTS))));
                }
            );

            update['dashboard:ingest'] = preferences;
            preferencesService.update(update).then(function(result) {
                if (refresh) {
                    $scope.fetchItems();
                }
            }, function(error) {
                notify.error(gettext('Ingest Dashboard preferences could not be saved.'), 2000);
            });
        };

        $scope.fetchItems();
    }

    IngestUserDashboard.$inject = ['api', 'userList', 'privileges'];
    function IngestUserDashboard (api, userList, privileges) {
        return {
            templateUrl: 'scripts/superdesk-ingest/views/dashboard/ingest-dashboard-widget.html',
            scope: {
                item: '=',
                setUserPreferences: '&'
            },
            link: function (scope) {

                function getCount() {
                    var criteria = {
                            source: {
                                query: {
                                    filtered: {
                                        filter: {
                                            and: [
                                                {term: {ingest_provider: scope.item._id}},
                                                {range: {versioncreated: {gte: 'now-24h'}}}
                                            ]
                                        }
                                    }
                                },
                                size: 0,
                                from: 0
                            }
                        };

                    api.ingest.query(criteria).then(function (result) {
                        scope.ingested_count = result._meta.total;
                    });
                }

                function updateProvider() {
                    api.ingestProviders.getById(scope.item._id).then(function (result) {
                        angular.extend(scope.item, result);
                        getUser();
                    }, function (error) {
                        if (error.status === 404) {
                            scope.item.dashboard_enabled = false;
                            scope.setUserPreferences();
                        }
                    });
                }

                function getLogMessages() {
                    var criteria = {
                        max_results: 5,
                        sort: '[(\'_created\',-1)]'
                    };

                    var where = [
                            {resource: 'ingest_providers'},
                            {'data.provider_id': scope.item._id}
                        ];

                    if (scope.item.log_messages === 'error') {
                        where.push({name: 'error'});
                    }

                    criteria.where = JSON.stringify ({
                        '$and': where
                    });

                    api.query('activity', criteria).then(function (result) {
                        scope.log_messages = result._items;
                    });
                }

                function refreshItem(data) {
                    if (data.provider_id === scope.item._id) {
                        getCount();
                        updateProvider();
                        getLogMessages();
                    }
                }

                function getUser() {
                    if (scope.item.is_closed && scope.item.last_closed && scope.item.last_closed.closed_by) {
                        userList.getUser(scope.item.last_closed.closed_by).then(function(result) {
                            scope.item.last_closed.display_name = result.display_name;
                        });
                    } else if (!scope.item.is_closed && scope.item.last_opened && scope.item.last_opened.opened_by) {
                        userList.getUser(scope.item.last_opened.opened_by).then(function(result) {
                            scope.item.last_opened.display_name = result.display_name;
                        });
                    }
                }

                function init() {
                    scope.showIngest = Boolean(privileges.privileges.ingest_providers);
                    scope.ingested_count = 0;
                    getCount();
                    getUser();
                    getLogMessages();
                }

                init();

                scope.isIdle = function() {
                    if (scope.item.last_item_update && !scope.item.is_closed) {
                        var idle_time =  scope.item.idle_time || DEFAULT_IDLE_TIME;
                        var last_item_update = moment(scope.item.last_item_update);
                        if (idle_time && !angular.equals(idle_time, DEFAULT_IDLE_TIME)) {
                            last_item_update.add(idle_time.hours, 'h').add(idle_time.minutes, 'm');
                            if (moment() > last_item_update) {
                                return true;
                            }else {
                                return false;
                            }
                        }
                    }
                    return false;
                };

                scope.filterLogMessages = function() {
                    scope.setUserPreferences();
                    getLogMessages();
                };

                scope.$on('ingest:update', function (evt, extras) {
                    refreshItem(extras);
                });

                scope.$on('ingest_provider:update', function (evt, extras) {
                    refreshItem(extras);
                });
            }
        };
    }

    IngestUserDashboardList.$inject = [];
    function IngestUserDashboardList () {
        return {
            templateUrl: 'scripts/superdesk-ingest/views/dashboard/ingest-dashboard-widget-list.html',
            scope: {
                items: '=',
                setUserPreferences: '&'
            }
        };
    }

    IngestUserDashboardDropDown.$inject = ['privileges'];
    function IngestUserDashboardDropDown (privileges) {
        return {
            templateUrl: 'scripts/superdesk-ingest/views/dashboard/ingest-sources-list.html',
            scope: {
                items: '=',
                setUserPreferences: '&'
            },
            link: function (scope) {
                scope.showIngest = Boolean(privileges.privileges.ingest_providers);
            }
        };
    }

    function ScheduleFilter() {
        return function(input) {
            var schedule = '';
            if (_.isPlainObject(input)) {
                schedule += (input.minutes && input.minutes > 0)? (input.minutes + (input.minutes > 1?' minutes':' minute')):'';
                schedule += schedule.length > 0?' ':'';
                schedule += (input.seconds && input.seconds > 0)? (input.seconds + (input.seconds > 1?' seconds':' second')):'';
            }
            return schedule;
        };
    }

    app
        .service('ingestSources', IngestProviderService)
        .service('remove', RemoveIngestedService)
        .factory('subjectService', SubjectService)
        .directive('sdIngestSourcesContent', IngestSourcesContent)
        .directive('sdIngestRulesContent', IngestRulesContent)
        .directive('sdIngestRoutingContent', IngestRoutingContent)
        .directive('sdIngestRoutingGeneral', IngestRoutingGeneral)
        .directive('sdIngestRoutingFilter', IngestRoutingFilter)
        .directive('sdIngestRoutingAction', IngestRoutingAction)
        .directive('sdIngestRoutingSchedule', IngestRoutingSchedule)
        .directive('sdPieChartDashboard', PieChartDashboardDirective)
        .directive('sdSortrules', SortRulesDirectives)
        .directive('sdUserIngestDashboardDropDown', IngestUserDashboardDropDown)
        .directive('sdUserIngestDashboardList', IngestUserDashboardList)
        .directive('sdUserIngestDashboard', IngestUserDashboard)
        .filter('insert', InsertFilter)
        .filter('scheduleFilter', ScheduleFilter);

    app.config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/workspace/ingest', {
                label: gettext('Workspace'),
                priority: 100,
                controller: IngestListController,
                templateUrl: 'scripts/superdesk-archive/views/list.html',
                category: '/workspace',
                topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html',
                privileges: {ingest: 1}
            })
            .activity('/settings/ingest', {
                label: gettext('Ingest'),
                templateUrl: 'scripts/superdesk-ingest/views/settings/settings.html',
                controller: IngestSettingsController,
                category: superdesk.MENU_SETTINGS,
                privileges: {ingest_providers: 1}
            })
            .activity('/ingest_dashboard', {
                label: gettext('Ingest Dashboard'),
                templateUrl: 'scripts/superdesk-ingest/views/dashboard/dashboard.html',
                controller: IngestDashboardController,
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                privileges: {ingest_providers: 1}
            })
            .activity('remove_ingested', {
                label: gettext('Remove'),
                icon: 'trash',
                controller: ['data', 'remove', function(data, remove) {
                    remove.remove(data.item);
                }],
                filters: [
                    {action: 'list', type: 'ingest'}
                ],
                additionalCondition:['remove', 'item', function(remove, item) {
                    return remove.canRemove(item);
                }],
                privileges: {fetch: 1}
            })
            .activity('fetchAs', {
                label: gettext('Fetch To'),
                icon: 'fetch-as',
                controller: ['data', 'send', function(data, send) {
                    send.allAs([data.item]);
                }],
                filters: [
                    {action: 'list', type: 'ingest'}
                ],
                privileges: {fetch: 1}
            })
            .activity('archive', {
                label: gettext('Fetch'),
                icon: 'archive',
                monitor: true,
                controller: ['send', 'data', function(send, data) {
                    return send.one(data.item);
                }],
                filters: [
                    {action: 'list', type: 'ingest'}
                ],
                privileges: {fetch: 1},
                key: 'f',
                additionalCondition: ['desks', function (desks) {
                    // fetching to 'personal' desk is not allowed
                    return desks.getCurrentDeskId() != null;
                }]
            })
            .activity('externalsource', {
                label: gettext('Get from external source'),
                icon: 'archive',
                monitor: true,
                controller: ['api', 'data', 'desks', function(api, data, desks) {
                    return desks.fetchCurrentDeskId().then(function(deskid) {
                        return api(data.item.fetch_endpoint).save({
                            guid: data.item.guid,
                            desk: deskid
                        })
                        .then(function(response) {
                            data.item = response;
                            data.item.actioning = angular.extend({}, data.item.actioning, {externalsource: false});
                            return data.item;
                        }, function errorHandler(error) {
                            data.item.error = error;
                            return data.item;
                        });
                    });
                }],
                filters: [{action: 'list', type: 'externalsource'}],
                privileges: {fetch: 1}
            });
    }]);

    app.config(['apiProvider', function(apiProvider) {
        apiProvider.api('fetch', {
            type: 'http',
            backend: {
                rel: 'fetch'
            }
        });
        apiProvider.api('ingest', {
            type: 'http',
            backend: {
                rel: 'ingest'
            }
        });
        apiProvider.api('ingestProviders', {
            type: 'http',
            backend: {
                rel: 'ingest_providers'
            }
        });
        apiProvider.api('searchProviders', {
            type: 'http',
            backend: {
                rel: 'search_providers'
            }
        });
        apiProvider.api('activity', {
            type: 'http',
            backend: {rel: 'activity'}
        });
    }]);

    SendService.$inject = ['desks', 'api', '$q', 'notify', '$injector', 'multi', '$rootScope'];
    function SendService(desks, api, $q, notify, $injector, multi, $rootScope) {
        this.one = sendOne;
        this.all = sendAll;

        this.oneAs = sendOneAs;
        this.allAs = sendAllAs;

        this.config = null;
        this.getConfig = getConfig;

        var vm = this;

        /**
         * Send given item to a current user desk
         *
         * @param {Object} item
         * @returns {Promise}
         */
        function sendOne(item) {
            return api
                .save('fetch', {}, {desk: desks.getCurrentDeskId()}, item)
                .then(
                    function(archiveItem) {
                        item.task_id = archiveItem.task_id;
                        item.archived = archiveItem._created;
                        multi.reset();
                        return archiveItem;
                    }, function(response) {
                        var message = 'Failed to fetch the item';
                        if (angular.isDefined(response.data._message)) {
                            message = message + ': ' + response.data._message;
                        }
                        notify.error(gettext(message));
                        item.error = response;
                    })
                ['finally'](function() {
                    if (item.actioning) {
                        item.actioning.archive = false;
                    }
                });
        }

        /**
         * Send all given items to current user desk
         *
         * @param {Array} items
         */
        function sendAll(items) {
            angular.forEach(items, sendOne);
        }

        /**
         * Send given item using config
         *
         * @param {Object} item
         * @param {Object} config
         * @param {string} config.desk - desk id
         * @param {string} config.stage - stage id
         * @param {string} config.macro - macro name
         * @returns {Promise}
         */
        function sendOneAs(item, config) {
            var data = getData(config);
            if (item._type === 'ingest') {
                return api.save('fetch', {}, data, item).then(function (archived) {
                    item.archived = archived._created;
                    if (config.open) {
                        $injector.get('authoringWorkspace').edit(archived);
                    }
                    return archived;
                });
            } else if (!item.lock_user) {
                return api.save('move', {}, {task: data}, item).then(function (item) {
                    $rootScope.$broadcast('item:update', {item: item});
                    return item;
                });
            }

            function getData(config) {
                var data = {
                    desk: config.desk
                };

                if (config.stage) {
                    data.stage = config.stage;
                }

                if (config.macro) {
                    data.macro = config.macro;
                }

                return data;
            }
        }

        /**
         * Send all given item using config once it's resolved
         *
         * At first it only creates a deferred config which is
         * picked by SendItem directive, once used sets the destination
         * it gets resolved and items are sent.
         *
         * @param {Array} items
         * @return {Promise}
         */
        function sendAllAs(items) {
            vm.config = $q.defer();
            return vm.config.promise.then(function(config) {
                vm.config = null;
                multi.reset();
                return $q.all(items.map(function(item) {
                    return sendOneAs(item, config);
                }));
            });
        }

        /**
         * Get deffered config if any. Used in $watch
         *
         * @returns {Object|null}
         */
        function getConfig() {
            return vm.config;
        }
    }

    RemoveIngestedService.$inject = ['api', '$rootScope'];
    function RemoveIngestedService(api, $rootScope) {
        this.canRemove = canRemove;
        this.remove = remove;
        this.fetchProviders = fetchProviders;

        var providers = {};

        /**
         * Fetch ingest providers in order to read if remove is allowed
         */
        function fetchProviders() {
            if (api.ingestProviders) {
                return api.ingestProviders.query({max_results: 200})
                .then(function(result) {
                    _.each(result._items, function(provider) {
                        providers[provider._id] = provider.allow_remove_ingested || false;
                    });
                });
            }
        }

        $rootScope.$on('ingest_provider:create', fetchProviders);
        $rootScope.$on('ingest_provider:update', fetchProviders);

        /**
         * Return true if the item can be removed
         *
         * @param {Object} item
         * @returns {boolean}
         */
        function canRemove(item) {
            return item.ingest_provider && providers[item.ingest_provider];
        }

        /**
         * Remove an ingested item
         *
         * @param {Object} item
         */
        function remove(item) {
            return api('ingest').remove(item);
        }
    }

    app.run(['remove', function(remove) {
        remove.fetchProviders();
    }]);
})();
