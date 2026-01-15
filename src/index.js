import { __ } from "@wordpress/i18n";
import { render, useEffect, useMemo, useState } from "@wordpress/element";
import { useSelect, dispatch, select } from "@wordpress/data";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Notice,
	Spinner,
	TextareaControl,
} from "@wordpress/components";
import {
	DataForm,
	DataViews,
	filterSortAndPaginate,
} from "@wordpress/dataviews";
import { useDispatch } from "@wordpress/data";
import { store as coreStore } from "@wordpress/core-data";
import "./style.scss";

/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from "@wordpress/private-apis";

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		"I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.",
		"@wordpress/editor",
	);

const DEFAULT_VIEW = {
	type: "table",
	search: "",
	page: 1,
	perPage: 10,
	sort: { field: "title", direction: "asc" },
	fields: ["author", "status"],
	titleField: "title",
};

const DEFAULT_LAYOUTS = {
	table: {},
	list: {},
	grid: {},
};

const FORM_CONFIG = {
	layout: { type: "regular", labelPosition: "top" },
	fields: ["title", "author", "status"],
};

const BOOK_FIELDS = [
	{
		id: "title",
		label: __("Title", "missing-create-entity-record"),
		type: "text",
		getValue: ({ item }) => item.title,
		setValue: ({ item, value }) => ({ ...item, title: value }),
		enableGlobalSearch: true,
	},
	{
		id: "author",
		label: __("Author", "missing-create-entity-record"),
		type: "text",
		getValue: ({ item }) => item.author,
		setValue: ({ item, value }) => ({ ...item, author: value }),
		enableGlobalSearch: true,
	},
	{
		id: "status",
		label: __("Status", "missing-create-entity-record"),
		type: "text",
		getValue: ({ item }) => item.status,
		setValue: ({ item, value }) => ({ ...item, status: value }),
	},
];

const DESIRED_SNIPPET = `const { dispatch } = wp.data;
const draft = dispatch( 'core' ).createEntityRecord(
  'postType',
  'book',
  { title: 'New book', status: 'draft', meta: { book_author: '' } }
);

// DataForm edits the draft in memory.
// The record is only saved when the user clicks Save.`;

const WORKAROUND_SNIPPET = `const { dispatch } = wp.data;
const saved = await dispatch( 'core' ).saveEntityRecord(
  'postType',
  'book',
  { title: 'New book', status: 'draft', meta: { book_author: '' } }
);

// The record already exists in the database,
// so canceling the flow needs cleanup.`;

const query = {
	per_page: 50,
	status: "any",
};

function mapRecordToBook(record) {
	const titleValue =
		typeof record.title === "string"
			? record.title
			: record.title?.raw || record.title?.rendered || "";
	return {
		id: record.id,
		title: titleValue,
		author: record.meta?.book_author || "",
		status: record.status || "draft",
		_record: record,
	};
}

function App() {
	const [view, setView] = useState(DEFAULT_VIEW);
	const [selectedId, setSelectedId] = useState(null);
	const [notice, setNotice] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isSavingAll, setIsSavingAll] = useState(false);

	const { records, editedRecords, isDirty, isResolving } = useSelect(
		(select) => {
			const { getEntityRecords } = select(coreStore);
			const { getStagedEntityRecords } = unlock(select(coreStore));
			const recordsResult = getEntityRecords("postType", "book", query) ?? [];
			const draftRecords = getStagedEntityRecords("postType", "book");
			const editedRecordsResult = [...draftRecords, ...recordsResult]?.map(
				(record) => {
					return select(coreStore).getEditedEntityRecord(
						"postType",
						"book",
						record.id,
					);
				},
			);

			return {
				records: recordsResult,
				editedRecords: editedRecordsResult,
				isDirty: store.__experimentalGetDirtyEntityRecords().length > 0,
				isResolving: store.isResolving("getEntityRecords", [
					"postType",
					"book",
					query,
				]),
			};
		},
		[],
	);

	const selectedRecord = useSelect(
		(select) => {
			if (!selectedId) {
				return null;
			}
			const store = select("core");
			if (store.getEditedEntityRecord) {
				return (
					store.getEditedEntityRecord("postType", "book", selectedId) ||
					store.getEntityRecord("postType", "book", selectedId)
				);
			}
			return store.getEntityRecord("postType", "book", selectedId);
		},
		[selectedId],
	);

	const isSelectedResolving = useSelect(
		(select) => {
			if (!selectedId) {
				return false;
			}
			const store = select(coreStore);
			if (!store.isResolving) {
				return false;
			}
			return store.isResolving("getEntityRecord", [
				"postType",
				"book",
				selectedId,
			]);
		},
		[selectedId],
	);

	const books = useMemo(() => {
		const sourceRecords = editedRecords || [];
		return sourceRecords?.map(mapRecordToBook);
	}, [editedRecords, records]);

	const { data: shownBooks, paginationInfo } = useMemo(() => {
		return filterSortAndPaginate(books, view, BOOK_FIELDS);
	}, [books, view]);

	const [draftSnapshot, setDraftSnapshot] = useState(null);
	useEffect(() => {
		if (selectedRecord) {
			setDraftSnapshot(mapRecordToBook(selectedRecord));
			return;
		}
		if (!selectedId) {
			setDraftSnapshot(null);
			return;
		}
		if (!isSelectedResolving) {
			setDraftSnapshot(null);
		}
	}, [selectedRecord, selectedId, isSelectedResolving]);

	const draft = draftSnapshot;

	const { createStagedEntityRecord } = unlock(useDispatch(coreStore));

	const createLocalDraft = () => {
		setNotice("");

		createStagedEntityRecord("postType", "book", {
			title: "New book",
			status: "draft",
			meta: { book_author: "" },
		});
	};

	const saveDraftNow = async () => {
		setNotice("");
		setIsSaving(true);
		try {
			const coreDispatch = dispatch("core");
			const saved = await coreDispatch.saveEntityRecord("postType", "book", {
				title: "New book",
				status: "draft",
				meta: { book_author: "" },
			});
			const savedBook = mapRecordToBook(saved);
			setSelectedId(savedBook.id);
			setNotice(
				__(
					"Workaround saved a draft to the database. If the user cancels, this record must be deleted.",
					"missing-create-entity-record",
				),
			);
		} catch (error) {
			setNotice(error.message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSelectBook = (book) => {
		setSelectedId(book.id);
		setNotice("");
	};

	const handleSave = async () => {
		if (!draft) {
			return;
		}

		setIsSaving(true);
		try {
			const coreDispatch = dispatch("core");
			if (coreDispatch.saveEditedEntityRecord) {
				await coreDispatch.saveEditedEntityRecord("postType", "book", draft.id);
			} else {
				await coreDispatch.saveEntityRecord("postType", "book", {
					id: draft.id,
					title: draft.title,
					status: draft.status,
					meta: { book_author: draft.author },
				});
			}
			setNotice(
				__("Saved book to the database.", "missing-create-entity-record"),
			);
		} catch (error) {
			setNotice(error.message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveAll = async () => {
		if (!isDirty) {
			return;
		}

		setNotice("");
		setIsSavingAll(true);
		try {
			const coreDispatch = dispatch("core");
			if (coreDispatch.saveEditedEntityRecord) {
				await Promise.all(
					editedRecords.map(({ id }) =>
						coreDispatch.saveEditedEntityRecord("postType", "book", id),
					),
				);
			} else {
				await Promise.all(
					editedIds.map((id) => {
						const store = select("core");
						const record = store.getEditedEntityRecord
							? store.getEditedEntityRecord("postType", "book", id)
							: store.getEntityRecord("postType", "book", id);
						if (!record) {
							return Promise.resolve();
						}
						return coreDispatch.saveEntityRecord("postType", "book", record);
					}),
				);
			}
			setNotice(
				__("Saved all drafts to the database.", "missing-create-entity-record"),
			);
		} catch (error) {
			setNotice(error.message);
		} finally {
			setIsSavingAll(false);
		}
	};

	const handleDeleteAll = async () => {
		if (books.length === 0) {
			return;
		}

		const shouldDelete = window.confirm(
			__(
				"Delete all books? This will permanently remove every book in the list.",
				"missing-create-entity-record",
			),
		);
		if (!shouldDelete) {
			return;
		}

		setNotice("");
		setIsSavingAll(true);
		try {
			const coreDispatch = dispatch("core");
			await Promise.all(
				books.map((book) =>
					coreDispatch.deleteEntityRecord("postType", "book", book.id, {
						force: true,
					}),
				),
			);
			setSelectedId(null);
			setNotice(
				__(
					"Deleted all books from the database.",
					"missing-create-entity-record",
				),
			);
		} catch (error) {
			setNotice(error.message);
		} finally {
			setIsSavingAll(false);
		}
	};

	return (
		<div className="mcer-admin">
			<div className="mcer-admin__header">
				<div>
					<h1>
						{__(
							"Missing createEntityRecord (DataViews/DataForm demo)",
							"missing-create-entity-record",
						)}
					</h1>
					<p className="mcer-admin__subhead">
						{__(
							"Goal: create a book draft in memory, edit it with DataForm, and only save on explicit confirmation.",
							"missing-create-entity-record",
						)}
					</p>
				</div>
				<Button variant="primary" onClick={createLocalDraft}>
					{__("New book (in-memory)", "missing-create-entity-record")}
				</Button>
			</div>

			{notice && (
				<Notice status="warning" isDismissible={false}>
					{notice}
				</Notice>
			)}

			<Card className="mcer-admin__card">
				<CardHeader>
					{__("Books (DataViews)", "missing-create-entity-record")}
				</CardHeader>
				<CardBody>
					{isResolving && <Spinner />}
					<DataViews
						data={shownBooks}
						view={view}
						fields={BOOK_FIELDS}
						onChangeView={setView}
						paginationInfo={paginationInfo}
						defaultLayouts={DEFAULT_LAYOUTS}
						getItemId={(item) => String(item.id)}
						renderItemLink={({ item, ...props }) => (
							<button
								className="mcer-admin__link"
								onClick={() => handleSelectBook(item)}
								{...props}
							>
								{props.children ||
									item.title ||
									__("(Untitled)", "missing-create-entity-record")}
							</button>
						)}
						empty={
							<p>
								{__(
									"No books yet. Use the New book action to see the missing createEntityRecord flow.",
									"missing-create-entity-record",
								)}
							</p>
						}
					/>
					<div className="mcer-admin__buttons">
						<Button
							variant="secondary"
							onClick={handleSaveAll}
							disabled={isSavingAll || !isDirty}
						>
							{__("Save all changes", "missing-create-entity-record")}
						</Button>
						<Button
							variant="secondary"
							isDestructive
							onClick={handleDeleteAll}
							disabled={isSavingAll || books.length === 0}
						>
							{__("Delete all books", "missing-create-entity-record")}
						</Button>
					</div>
				</CardBody>
			</Card>

			<Card className="mcer-admin__card">
				<CardHeader>
					{__("Book form (DataForm)", "missing-create-entity-record")}
				</CardHeader>
				<CardBody>
					{!draft && (
						<p>
							{__(
								"Select a book or try to create a new draft to see the DataForm experience.",
								"missing-create-entity-record",
							)}
						</p>
					)}
					{draft && (
						<DataForm
							data={draft}
							fields={BOOK_FIELDS}
							form={FORM_CONFIG}
							onChange={(nextDraft) => {
								if (!nextDraft?.id) {
									return;
								}
								dispatch("core").editEntityRecord(
									"postType",
									"book",
									nextDraft.id,
									{
										title: nextDraft.title,
										status: nextDraft.status,
										meta: { book_author: nextDraft.author },
									},
								);
							}}
						/>
					)}
					<div className="mcer-admin__form-actions">
						<TextareaControl
							label={__("Desired flow", "missing-create-entity-record")}
							value={DESIRED_SNIPPET}
							readOnly
							rows={8}
						/>
						<TextareaControl
							label={__("Current workaround", "missing-create-entity-record")}
							value={WORKAROUND_SNIPPET}
							readOnly
							rows={8}
						/>
					</div>
					<div className="mcer-admin__buttons">
						<Button
							variant="secondary"
							onClick={saveDraftNow}
							disabled={isSaving}
						>
							{__("Workaround: save draft now", "missing-create-entity-record")}
						</Button>
						<Button
							variant="primary"
							onClick={handleSave}
							disabled={!draft || isSaving}
						>
							{__("Save", "missing-create-entity-record")}
						</Button>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}

function renderApp() {
	const root = document.getElementById("mcer-root");
	if (!root) {
		return;
	}

	render(<App />, root);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", renderApp);
} else {
	renderApp();
}
