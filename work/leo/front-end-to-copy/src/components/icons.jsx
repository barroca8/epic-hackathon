// Change an icon here and it changes everywhere. Style: Phosphor duotone (see main.jsx).
import {
  CaretLeft, CaretRight, ChartBar, Check, Compass, Copy, DownloadSimple, FileText, Graph, HandWaving,
  House, IdentificationCard, Link, Lock, MagnifyingGlass, PaperPlaneTilt, PencilSimple, QrCode,
  ShareNetwork, Sparkle, Tray, UploadSimple, User, UsersThree, X,
} from '@phosphor-icons/react'

const ICONS = {
  back: CaretLeft, next: CaretRight, stats: ChartBar, check: Check, roles: Compass, copy: Copy,
  download: DownloadSimple, file: FileText, graph: Graph, request: HandWaving, home: House,
  card: IdentificationCard, link: Link, lock: Lock, search: MagnifyingGlass, send: PaperPlaneTilt,
  edit: PencilSimple, qr: QrCode, share: ShareNetwork, sparkle: Sparkle, inbox: Tray,
  upload: UploadSimple, profile: User, users: UsersThree, close: X,
}

export default function Icon({ name, ...props }) {
  const Component = ICONS[name]
  return <Component {...props} />
}
