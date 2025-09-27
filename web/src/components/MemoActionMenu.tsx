import { Dropdown, Menu, MenuButton, MenuItem } from "@mui/joy";
import copy from "copy-to-clipboard";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BookmarkMinusIcon,
  BookmarkPlusIcon,
  CopyIcon,
  Edit3Icon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { memoServiceClient } from "@/grpcweb";
import { useMemoStore, useUserStore } from "@/store/v1";
import { Memo, Visibility } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { memoLink } from "@/utils/memo";
import { shareMemoImage } from "@/utils/share";

interface Props {
  memo: Memo;
  // The visibility of the memo.
  // It can be different from `memo.visibility` if the memo is a comment.
  visibility?: Visibility;
  className?: string;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

const MemoActionMenu = (props: Props) => {
  const { memo, className } = props;
  const t = useTranslate();
  const location = useLocation();
  const navigateTo = useNavigateTo();
  const userStore = useUserStore();
  const memoStore = useMemoStore();
  const isVisitor = userStore.isVisitor;
  const isArchived = memo.rowStatus === "ARCHIVED";
  const allowEdit = !isVisitor && memo.creator === userStore.user?.name;
  const allowAdmin = userStore.isHost || userStore.isAdmin;
  const allowDelete = !isVisitor && (allowAdmin || memo.creator === userStore.user?.name);
  const memoVisibility = props.visibility ?? memo.visibility;

  const handleEditMemoClick = () => {
    if (props.onEdit) {
      props.onEdit(memo.content);
    }
  };

  const handlePinMemoClick = async () => {
    if (props.onPin) {
      props.onPin();
    }
  };

  const handleUnpinMemoClick = async () => {
    if (props.onUnpin) {
      props.onUnpin();
    }
  };

  const handleCopyLink = () => {
    copy(`${window.location.origin}${memoLink(memo)}`);
    toast.success(t("message.succeed-copy-link"));
  };
  
  // 这是我们新增的函数
  const handleCopyContent = () => {
    copy(memo.content);
    toast.success("Content copied!");
  };

  const handleShareMemoImage = async () => {
    await shareMemoImage(memo);
  };

  const handleArchiveMemoClick = async () => {
    if (props.onArchive) {
      props.onArchive();
      return;
    }
    await memoStore.updateMemo(
      {
        name: memo.name,
        rowStatus: "ARCHIVED",
      },
      ["row_status"],
    );
    if (location.pathname === memoLink(memo)) {
      navigateTo("/archived");
    }
    toast(t("message.archived-successfully"));
  };

  const handleRestoreMemoClick = async () => {
    if (props.onRestore) {
      props.onRestore();
      return;
    }
    await memoStore.updateMemo(
      {
        name: memo.name,
        rowStatus: "NORMAL",
      },
      ["row_status"],
    );
    toast.success(t("message.restored-successfully"));
  };

  const handleDeleteMemoClick = async () => {
    const confirmed = window.confirm(t("memo.delete-confirm"));
    if (confirmed) {
      if (props.onDelete) {
        props.onDelete();
        return;
      }
      await memoServiceClient.deleteMemo({ name: memo.name });
      toast.success(t("message.deleted-successfully"));
      if (location.pathname === memoLink(memo)) {
        navigateTo("/");
      }
    }
  };

  return (
    <Dropdown>
      <MenuButton slots={{ root: "div" }}>
        <span className={className}>
          <MoreVerticalIcon className="w-4 h-auto text-gray-500 dark:text-gray-400" />
        </span>
      </MenuButton>
      <Menu className="text-sm" size="sm" placement="bottom-end">
        {!isArchived ? (
          <>
            {allowEdit && (
              <MenuItem onClick={handleEditMemoClick}>
                <Edit3Icon className="w-4 h-auto" />
                {t("common.edit")}
              </MenuItem>
            )}
            {!isVisitor &&
              (memo.pinned ? (
                <MenuItem onClick={handleUnpinMemoClick}>
                  <BookmarkMinusIcon className="w-4 h-auto" />
                  {t("common.unpin")}
                </MenuItem>
              ) : (
                <MenuItem onClick={handlePinMemoClick}>
                  <BookmarkPlusIcon className="w-4 h-auto" />
                  {t("common.pin")}
                </MenuItem>
              ))}
            {memoVisibility !== Visibility.PRIVATE && (
              <>
                <MenuItem onClick={handleCopyLink}>
                  <CopyIcon className="w-4 h-auto" />
                  {t("memo.copy-link")}
                </MenuItem>
                
                {/* 这是我们新增的按钮 */}
                <MenuItem onClick={handleCopyContent}>
                  <CopyIcon className="w-4 h-auto" />
                  Copy Content
                </MenuItem>
              </>
            )}
            <MenuItem onClick={handleShareMemoImage}>
              <Icon.Share className="w-4 h-auto" />
              {t("common.share")}
            </MenuItem>
            {allowEdit && (
              <MenuItem color="warning" onClick={handleArchiveMemoClick}>
                <ArchiveIcon className="w-4 h-auto" />
                {t("common.archive")}
              </MenuItem>
            )}
          </>
        ) : (
          <>
            {allowEdit && (
              <MenuItem onClick={handleRestoreMemoClick}>
                <ArchiveRestoreIcon className="w-4 h-auto" />
                {t("common.restore")}
              </MenuItem>
            )}
          </>
        )}
        {allowDelete && (
          <MenuItem color="danger" onClick={handleDeleteMemoClick}>
            <TrashIcon className="w-4 h-auto" />
            {t("common.delete")}
          </MenuItem>
        )}
      </Menu>
    </Dropdown>
  );
};

export default MemoActionMenu;
