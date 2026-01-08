=== Missing createEntityRecord ===
Contributors:      The WordPress Contributors
Tags:              admin, core-data, dataviews, dataform
Tested up to:      6.7
Stable tag:        0.1.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Demo plugin showing the missing createEntityRecord action needed for DataViews/DataForm.

== Description ==

This plugin adds an admin page that demonstrates the missing `createEntityRecord` action from `@wordpress/core-data`.
DataViews/DataForm needs to create an entity in memory (draft state) without persisting to the database. The current
API only supports `saveEntityRecord`, which writes immediately and forces cleanup when a user cancels a form.

Open the **Missing createEntityRecord** admin menu to see the list of books rendered with DataViews, and a DataForm
that can only edit an existing record unless you save a draft first.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/missing-create-entity-record` directory, or install the plugin through the WordPress plugins screen directly.
1. Activate the plugin through the 'Plugins' screen in WordPress.
1. Open **Missing createEntityRecord** from the admin menu.
1. Click **New book (in-memory)** to reproduce the missing action and see the workaround.

== Development ==

To run a local test site with wp-env:

1. Run `npm install` to install dependencies (includes `@wordpress/env`).
1. Run `npm run wp-env` to start WordPress and mount the plugin.
1. Run `npm run wp-env:stop` when finished.

