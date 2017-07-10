# Superdesk Client Changelog

## [1.7.3] 2017-07-10

### Fixed

- Fix issue with single line input for editor block description.

## [1.7.2] 2017-07-04

### Fixed

- Make tansa language profile ids configurable.
- Make authoring widget shortcuts global.
- Stop on error when publishing.
- Fix issue with authoring shortcuts.
- Fix jumping cursor on image caption field.
- Allow tansa to run multiple times.

## [1.7.1] 2017-06-06

### Fixed

- Fix updating `_etags` when item is locked/unlocked.
- Fix aggregation criteria reseting on single query when refresh frame is `ON`.

## [1.7.0] 2017-05-23

### Fixed

- Fix `null` value set for item profile if not enabled on desk.
- Fix monitoring stage running multiple queries on item open/close.
- Remove create content from spike and highlights views.
- Fix tansa running twice.
- Fix issue when template header is not visible.
- Hide company codes if not activated via content profile.
- Remove duplicate action on killed items.
- Fix tansa checking on feature media.
- Fix translate action not performed on items in the list view.
- Increate stage max size from 15 to 40.
- Enable template save button on change.
- Show profile dropdown for text items only.
- Close send to pane when an item is spiked.
- Hide spinner when saving area of interest fails.
- Update angular-embed to version supporting angular 1.6.
- Use specific versions of dependencies.
- Fix tooltips in duplicate tab and related item tab.
- No duplicate option on items in read-only stage.
- Enable mark for desk on text items only.
- Handle missing desk in templates settings.
- Correct and Kill buttons missing when workqueue item is opened.
- Modify versions tooltip in the editor.
- Disable save button when area of interest is opened.
- Improve ui in settings sections.
- Fix tooltips in metadata preview for type, priority and urgency.
- Enable save button when template is valid.
- Hide duplicates and used tab in metadata if empty.
- Fix slugline and take key fields editing in template editor.
- Fix missing fields when item is created from template.
- Fix reseting for subscriber type filter.
- Fix macros handling in action picker.
- Hide *Send and Continue* when `noTakes` config is enabled.
- Constant spinning sheel on item unspiking.
- Sort highlights by name.
- Only show format options on fields using editor in content profile.
- Remember last duplicate to destination.
- Fix moment timezone related console errors.
- Hide Global Read off stages from send to pane.
- Setting an item not for publication does not disable publish panel.
- Reopen does not work in the all opened items dialog.
- Double click on external source doesn't fetch item.
- Remove duplicates and history tabs from preview for external items.
- Image preview does not keep aspect ratio.
- Don't show footer helpline for multimedia items while editing.
- Fix headers issue after eve upgrade to 0.7.2.
- Fix query when fetching items from queue.
- Rewrite monitoring widget using React.
- Creator dropdown in global search has inconsisten user names.
- Add missing date search tags.
- Fix max height issue when monitoring group widget is configured for 25 items.
- Save and validate before send & publish action.
- Only display plugins if user has privileges.
- Fix fetching from external source to custom workspace.
- Minimize amount of prepopuplate requests when testing.
- Sign off field doesn't reflect updated value.
- Missing footers in print preview.
- Trigger search via enter on search providers parameters.
- Fix keyboard shortucts which were not working across browsers.
- Fix modal closing via keyboard.
- Enable scrolling in highlights/desk lists.

### Added

- Add option to disable missing link warning.
- Add cancel button to monitoring settings modal.
- Add *Used* tab for media items if they are used in a story.
- Add feature media metadata to metadata tab.
- Provide distinct caption and description for images.
- Add product types to products.
- Add *Get from external source to* action to external items.
- Add tables support in editor3.
- Allow duplication to different desk/stage.
- Add file extention config for ftp transmissions.
- Add option to clear publish schedule date and time on send.
- Support featured media in templates.
- Add progress indicator when item is fetched from external repo.
- Add internal destinations management.
- Add stage dropdown to monitoring view.
- Add filter to content profiles for active/inactive.
- Test case for word counts.
- Item history view.
- Multi-view of item version history.
- Added Wufoo service provider config.
- Export and download feature for items.
- Support parent based search for subject tree field.
- Show email list subscription form.
- Support for elasti 2.x.

### Changed

- Change spellcheck shortcut to `ctrl+shift+y`.
- Hide related items widget for picture items.
- Order settings alphabetically.
- Remove groups settings.
- Only allow text items to be added to highlights.
- Update angular to 1.6.3.
- Add maxlength validation for multimedia metadata.
- Removing paranthesis from search bar keywords.
- Exclude SMS, Abstract, Dateline, Footer and Sign Off on multi-media items.
- Display marked for desk items as a separate group in monitoring.
- Show take key, related item count and missing link in authoring header.
- Allow spiked content in global search.
- Analytics has its own repository.
- Override values using content profile default when profile is changed.
- Improve related item widget - display links.

## [1.6.2] 2017-04-06

### Fixed

- Fix moment-timezone version to 0.5.11.

## [1.6.1] 2017-03-09

### Fixed

- Fix build after new angular release.
- Fix issue where renditions were not saved after original was modified.
- Fix lost scroll position when user opens an item in authoring.
- Pick item when select box is clicked.
- Fix preview is not closed when an item is opened for authoring.
- Hilite featured placeholder on dragover event.
- Fix grouping of macros when group is missing.
- Fix esc key handling in modal directives.
- Fix bad schema settings in content profiles when using min length.
- Disable reseting of items when performing multi select.
- Filter profiles by desk in authoring.
- Fix issue with scrolling in monitoring widget.
- Fix tansa proofing.
- Fix related widget to show state and display results when widget is opened.
- Fix typos and grammar in UI.

### Added

- Prefix `Archived from` to desk info for archived items.

### Changed

- Make `singleLine` a new config.

## [1.6.0] 2017-02-16

### Fixed

- Fix media captions are checked by Tansa but changes are not saved.
- Updated translations.
- Fix missing styles for item preview.
- Make word counts consistent with server.
- Fix missing items in monitoring widget.
- Remove unwanted tags in item headline.
- Fix scrolling when selecting an item.
- Fix error in image crops editing when selected are is smaller than rendition.
- New crop of original image should not be less than crops defined.
- Keep items selected when going to single desk view and back.
- Wrap guid in metadata panel.
- Fix selecting default content profile in authoring.
- Fix workqueue items not being unlocked after spiking.
- Disable some widgets when item is spiked.
- All renditions and metadata updates should be saved together.
- Disable post button when there is no text in comment form.
- Use user settings to load locales data.
- Correct highlight behaviour based on user desk privileges.
- Fix fetching of items from external source.
- Cache fetch all queries in desks service.
- Fix multiselecting when using keyboard shortcut.
- Fix cursor position issues when editing tables.

### Changed

- Change spike view of desk to show more items.
- Spellchecker should not mark capitalized words as mistakes.
- Change initial number of items in single group monitoring to 50.
- `thinRown` config is now a user preference.

### Added

- New editor based on draft-js (experimental).
- Let pluggins add items to side nav menu.
- Display queue errors for published items.
- Group macros in authoring view.
- Add desk/stage info to item preview.
- Add tooltips to associate indicators.
- Add mark for desk feature.
- Validate data in routing scheme form.
- Mark required fields when adding/editing subscriber.
- Add `ctrl+shift+#` shortcut for spiking an item.
- Allow config changes without rebuild.
- Add password-less authentication via jabber.
- Add remove link to other stories item action.
- Allow selecting of items via `x` shortcut.
- Add filter for items with featured media.
- Add content api token management for subscribers.
- Allow specific narrow view config when there is both preview and authoring opened.

## [1.5.2] 2017-01-18

### Fixed

- Sort content filter `field` drop down.
- Avoid translation of field names in content filters.
- Fix editing of content profiles with custom fields.

### Changed

- Update ukranian translation.
- Reduce item height by half for thinRows config.
- Only `text` type items in `archived` collection can be duplicated.

### Added

- Add `BCC` config for email subscribers.

## [1.5.1] 2017-01-03

Includes changes from 1.4.8 plus:

### Fixed

- Make scrollbar always visible in swimline view.
- Pull actions menu for related items to the right.

### Changed

- Use po files for translations from customer repo if any.
- Update russian translation.

## [1.5] 2016-12-21

### Fixed

- Fix takes link on monitoring and preview.
- Fix translations in widgets list.
- Scroll to highlighted and active text when using macro prev/next.
- Fix desk dropdown in send to panel.
- Cache spellchecking dictionaries.
- Fix UI in routing schema modal.
- Keep selected repositories when clearing search filters.
- Serve duplicate server requests from cache.
- Fix weekday picker active state style.
- Add error notification for duplicate unique name when publishing.
- Target type of routing scheme rule is always negative.
- Fix UI for swimlane view.
- Cache vocabularies to reduce api calls.
- Prevent monitoring widgets to grow in size.
- Add support for HTML in confirmation headline and body.
- Do not limit to 25 when fetching users desks.
- Add version to app.bundle on build.
- Fix filter UI when switching between presets and dates.
- Scroll to active text position when in find and replace.
- Turn off automatic spellchecking if there is no dictionary.

### Changed

- Use projections in search results.
- Use prefered desk in send to panel.

### Added

- Add `ctrl+k` shortcut for spike action.
- Add duplicate action to text archive items.
- Add live suggestions modal.
- Add styles for `blockquote` in editor.

## [1.4.7] 2016-12-20

### Fixed

- Fix user profile link to mentioned users for users with `.` in username.

## [1.4.6] 2016-12-09

### Fixed

- Fix raven lib version.
- Fix angular lib version.

## [1.4.5] 2016-12-06

### Fixed

- Style fixes for the editor.

## [1.4.4] 2016-12-05

### Added

- Add desk language picker.

## [1.4.3] 2016-12-05

### Changed

- Improve look of html tables in the editor.

### Fixed

- Fixed issue when switching between search providers and superdesk.

## [1.4.2] 2016-11-30

### Fixed

- Make tansa min urgency configurable.
- Unordered list is not shown with bullets points.

## [1.4.1] 2016-11-29

### Added

- Add support for graphic type.

### Fixed

- Fix translation issue for publish.

## [1.4] 2016-11-15

### Added

- Related item search preference added to session.
- Allow complex boolean queries in search.
- Add `thinkRows` configuration for more condensed monitoring view.
- Add swimlane view to monitoring.

### Changed

- SMS message is populated using abstract.
- Disable formatting for byline field.

### Fixed

- Monitoring queries optimizations.
- Preview in monitoring with ingest.
- Link to revisions on about modal are clickable.
- Date fields in search don't reset when value is cleared.
- Let user with `templates` privilege edit desk templates.
- Show `sign_off` field for routed items and items create from template.
- Fix url validation for links in editor.

## [1.3] 2016-10-17

### Added

- Update browser title with info where you are in superdesk.
- Add item history tab to preview pane.
- Add send and publish action.
- Add *pass throught* option to ingest providers.
- Add typeahead into desk select in send to pane.
- Add remove aggregate func in search.

### Changed

- Allow item to be duplicated to default desk or user private space.
- Report conflicting update in desk management.

### Fixed

- Fix saving of an item after failed publishing.
- Improve performance after scroll lock.
- Embargo datetime fields require embargo privilege.
- Fix *critical error* tabs in subscribers and ingest sources modals.
- Make vocabulary column headers fixed.
- Reload saved searches in monitoring config on update.
- Enable save button when picture is dropped on featured placeholder.
- Keep editor toolbar visible when scrolling.
- Fix search when using non english translations.
- Save image metadata updates when saving crop info.

## [1.2] 2016-10-05

### Added

- Highlight multiple spaces in spellcheck and suggest a single space instead.
- Add related item configuration to search slugline using exact match, prefix match or any word match.
- Add `useDefaultTimezone` for global search queries.
- Add ingest provider to search
- Add image metadata validation on publish
- Add url validation to editor anchor button
- Added `Send and Publish` so that item can be first send and published from different desk.

### Fixed

- Fix global search to include time part for date search.
- Fix related item search to look for exact slugline search.
- Fix refs in package were missing type.
- Fix spike view for custom workspace
- Activate save button after editing crops
- Fix aggregations not updating
- Disable crop editing for audio/video
- Fix image drag&drop in chrome

## [1.1] 2016-08-29

### Added

- Add `noTakes` config option to disable takes in ui
- Display more versions in history panel.
- Add config to hide takes related controls.

### Fixed

- Fix desk selection is monitoring if not default desk
- Fix elastic highlight config to use `features` key.
- Fix metadataview for slugline to display elastic highlight
- Fix elastic highlight for saved searches.
- Hide publish button for highlights packages.
- Fix layout issue with action menu in preview pane.
- Fix recursive calling of desk mentions query.
- Fix dashboard widget thumnails not being visible.
- Fix apply crop button not activating save button in authoring.
- Fix hyperlink plugin in authoring.
- Fix missing pagination buttons in publish queue.

## [1.0] 2016-08-17

### Fixed

- Fix undo/redo changes not being saved or autosaved
- Fix undo/redo for new item not reverting to empty body after save
- Fix undo/redo not working properly with complex fields (dateline, category, subject)
- Fix images uploaded into private space are not visible

## [1.0.0-beta1] 2016-04-26

- initial "public" release

## [0.3] 2014-02-24

- **users**: implement user form validation [ffdf478](https://github.com/superdesk/superdesk-client/commit/ffdf47834e5d7833098f03343b8d3e566df3e3d2)
- **users**: check if username exists when creating a user [87b0f03](https://github.com/superdesk/superdesk-client/commit/87b0f0333eec5cb10107d5848e759622dc03294e)
- **tests**: add protractor e2e test for login [d5bf1db](https://github.com/superdesk/superdesk-client/commit/d5bf1dbc2bfe4461090a6f575248b37532eb5813)

## [0.2] 2014-02-10

- feat(ingest): implement subject filtering
- feat(archive): implement filtering
- test(scratchpad): add tests
- fix(css): fix 'add widget' modal, ingest list, active menu items, ..

## [0.1] 2014-02-04

- **users**: list, create and edit users
- **ingest**: list and search items, fetch items into archive
- **archive**: list archived ingest items, edit
- **scratchpad**: drag ingest items into scratchpad
- **desks**: create and list desks, assign members
- **dashboard**: list available widgets, save user dashboard
