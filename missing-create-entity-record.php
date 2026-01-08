<?php
/**
 * Plugin Name:       Missing createEntityRecord
 * Description:       Demo admin page showing the missing createEntityRecord action needed for DataViews/DataForm.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       missing-create-entity-record
 *
 * @package Mcer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function mcer_register_book_post_type() {
	register_post_type(
		'book',
		array(
			'labels'       => array(
				'name'          => __( 'Books', 'missing-create-entity-record' ),
				'singular_name' => __( 'Book', 'missing-create-entity-record' ),
			),
			'public'       => false,
			'show_ui'      => true,
			'show_in_menu' => true,
			'show_in_rest' => true,
			'supports'     => array( 'title' ),
		)
	);

	register_post_meta(
		'book',
		'book_author',
		array(
			'single'       => true,
			'type'         => 'string',
			'show_in_rest' => true,
			'default'      => '',
		)
	);
}
add_action( 'init', 'mcer_register_book_post_type' );

function mcer_register_admin_page() {
	add_menu_page(
		__( 'Missing createEntityRecord', 'missing-create-entity-record' ),
		__( 'Missing createEntityRecord', 'missing-create-entity-record' ),
		'manage_options',
		'mcer-missing-create-entity-record',
		'mcer_render_admin_page',
		'dashicons-warning',
		58
	);
}
add_action( 'admin_menu', 'mcer_register_admin_page' );

function mcer_render_admin_page() {
	?>
	<div class="wrap">
		<div id="mcer-root"></div>
	</div>
	<?php
}

function mcer_enqueue_admin_assets( $hook ) {
	if ( 'toplevel_page_mcer-missing-create-entity-record' !== $hook ) {
		return;
	}

	$asset_path = __DIR__ . '/build/index.asset.php';
	$asset      = file_exists( $asset_path ) ? require $asset_path : array(
		'dependencies' => array(),
		'version'      => '0.1.0',
	);

	wp_enqueue_script(
		'mcer-admin',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		true
	);
	wp_enqueue_style(
		'mcer-admin',
		plugins_url( 'build/style-index.css', __FILE__ ),
		array( 'wp-components' ),
		$asset['version']
	);
	wp_style_add_data( 'mcer-admin', 'rtl', 'replace' );
}
add_action( 'admin_enqueue_scripts', 'mcer_enqueue_admin_assets' );
