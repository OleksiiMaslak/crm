import { Alert, Button, Form, Input, Select, Space, Table, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Repository } from '../api/repositories'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { logoutUser } from '../store/auth/auth.slice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addRepository,
  clearAddError,
  fetchRepositories,
  refreshRepository,
  removeRepository,
} from '../store/repositories/repositories.slice'
import '../App.css'

type AddFormValues = { repository: string }
type StarsFilter = 'all' | 'gt0' | 'gte100' | 'gte1000'

const UNKNOWN_LANGUAGE = '__unknown__'

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, isFetching, isAdding, error, addError } = useAppSelector((s) => s.repositories)
  const { user } = useAppSelector((s) => s.auth)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [languageFilter, setLanguageFilter] = useState(() => {
    const value = searchParams.get('lang')
    if (!value || value === 'all') return 'all'
    return value === 'Unknown' ? UNKNOWN_LANGUAGE : value
  })
  const [starsFilter, setStarsFilter] = useState<StarsFilter>(() => {
    const value = searchParams.get('stars')
    if (value === 'gt0' || value === 'gte100' || value === 'gte1000') {
      return value
    }
    return 'all'
  })
  const [form] = Form.useForm<AddFormValues>()

  useEffect(() => {
    void dispatch(fetchRepositories())
  }, [dispatch])

  useEffect(() => {
    const nextParams = new URLSearchParams()

    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      nextParams.set('q', trimmedQuery)
    }

    if (languageFilter !== 'all') {
      nextParams.set('lang', languageFilter)
    }

    if (starsFilter !== 'all') {
      nextParams.set('stars', starsFilter)
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchQuery, languageFilter, starsFilter, searchParams, setSearchParams])

  const handleLogout = () => {
    void dispatch(logoutUser())
    navigate('/login', { replace: true })
  }

  const handleAdd = (values: AddFormValues) => {
    const [owner, name] = values.repository.split('/')
    void dispatch(addRepository({ owner, name })).then((action) => {
      if (addRepository.fulfilled.match(action)) {
        form.resetFields()
        dispatch(clearAddError())
      }
    })
  }

  const languageOptions = useMemo(() => {
    const langs = Array.from(
      new Set(items.map((repo) => (repo.language?.trim() || UNKNOWN_LANGUAGE))),
    ).sort((a, b) => a.localeCompare(b))

    return [
      { value: 'all', label: t('dashboard.filters.allLanguages') },
      ...langs.map((lang) => ({
        value: lang,
        label: lang === UNKNOWN_LANGUAGE ? t('dashboard.filters.unknownLanguage') : lang,
      })),
    ]
  }, [items, t])

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return items.filter((repo) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        repo.owner.toLowerCase().includes(normalizedQuery) ||
        repo.name.toLowerCase().includes(normalizedQuery) ||
        repo.url.toLowerCase().includes(normalizedQuery)

      const repoLanguage = repo.language?.trim() || UNKNOWN_LANGUAGE
      const matchesLanguage = languageFilter === 'all' || repoLanguage === languageFilter

      const matchesStars =
        starsFilter === 'all' ||
        (starsFilter === 'gt0' && repo.stars > 0) ||
        (starsFilter === 'gte100' && repo.stars >= 100) ||
        (starsFilter === 'gte1000' && repo.stars >= 1000)

      return matchesQuery && matchesLanguage && matchesStars
    })
  }, [items, searchQuery, languageFilter, starsFilter])

  const columns = useMemo(
    () => [
      {
        title: t('dashboard.table.owner'),
        dataIndex: 'owner',
        key: 'owner',
        render: (owner: string) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>
            {owner}
          </span>
        ),
      },
      {
        title: t('dashboard.table.name'),
        dataIndex: 'name',
        key: 'name',
        render: (name: string) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>
            {name}
          </span>
        ),
      },
      {
        title: t('dashboard.table.url'),
        dataIndex: 'url',
        key: 'url',
        render: (url: string) => (
          <div className="url-cell">
            <span className="url-text" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-blue)', zIndex: 100 }}>
              {url}
            </span>
            <Tooltip title={t('dashboard.table.openInNewTab')}>
              <Button
                type="default"
                size="small"
                className="url-go-btn"
                onClick={() => {
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
              >
                <span className="url-go-icon" aria-hidden="true">↗</span>
                {t('dashboard.table.go')}
              </Button>
            </Tooltip>
          </div>
        ),
      },
      {
        title: t('dashboard.table.stars'),
        dataIndex: 'stars',
        key: 'stars',
        sorter: (a: Repository, b: Repository) => a.stars - b.stars,
        render: (v: number) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
            {v.toLocaleString()}
          </span>
        ),
      },
      {
        title: t('dashboard.table.forks'),
        dataIndex: 'forks',
        key: 'forks',
        render: (v: number) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
            {v.toLocaleString()}
          </span>
        ),
      },
      {
        title: t('dashboard.table.issues'),
        dataIndex: 'openIssues',
        key: 'openIssues',
        render: (v: number) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
            {v.toLocaleString()}
          </span>
        ),
      },
      {
        title: t('dashboard.table.created'),
        dataIndex: 'createdAtUtcUnix',
        key: 'createdAtUtcUnix',
        sorter: (a: Repository, b: Repository) => a.createdAtUtcUnix - b.createdAtUtcUnix,
        render: (timestamp: number) => (
          <Tooltip title={t('dashboard.table.createdTooltip', { timestamp })}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
              {new Date(timestamp * 1000).toLocaleDateString(i18n.language.startsWith('uk') ? 'uk-UA' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </Tooltip>
        ),
      },
      {
        title: t('dashboard.table.actions'),
        key: 'actions',
        width: 100,
        render: (_: unknown, record: Repository) => (
          <Space size={6}>
            <Tooltip title={t('dashboard.table.refresh')}>
              <Button
                size="small"
                type="text"
                style={{ color: 'var(--accent-blue)', fontSize: 13 }}
                onClick={() => void dispatch(refreshRepository(record.id))}
              >
                ↻
              </Button>
            </Tooltip>
            <Tooltip title={t('dashboard.table.delete')}>
              <Button
                size="small"
                type="text"
                danger
                onClick={() => void dispatch(removeRepository(record.id))}
              >
                ✕
              </Button>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [dispatch, i18n.language, t],
  )

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="header-logo-icon">🔗</div>
          <span className="header-logo-text">github-crm</span>
        </div>
        <div className="header-user">
          <LanguageSwitcher />
          <span
            className="header-email"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          >
            {user?.email}
          </span>
          <Button size="small" onClick={handleLogout} style={{ fontSize: 13 }}>
            {t('dashboard.logout')}
          </Button>
        </div>
      </header>

      <main className="dashboard-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Typography.Title className="section-title">
            {t('dashboard.title')}
            <span
              style={{
                marginLeft: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--text-muted)',
              }}
            >
              {t('dashboard.shownCount', { filtered: filteredItems.length, total: items.length })}
            </span>
          </Typography.Title>
        </div>

        {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} />}
        <div className="add-repo-feedback">{addError && <Alert message={addError} type="error" showIcon />}</div>

        <Form form={form} onFinish={handleAdd} className="add-repo-form-row">
          <Form.Item
            name="repository"
            rules={[
              { required: true, message: t('dashboard.add.required') },
              {
                pattern: /\//,
                message: t('dashboard.add.invalidFormat'),
              },
            ]}
            style={{ margin: 0, flex: 1, maxWidth: 400 }}
          >
            <Input
              placeholder={t('dashboard.add.placeholder')}
              onChange={() => {
                if (addError) {
                  dispatch(clearAddError())
                }
              }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isAdding} style={{ fontWeight: 600 }}>
            {t('dashboard.add.submit')}
          </Button>
        </Form>

        <div className="repo-filters-row">
          <Input
            allowClear
            value={searchQuery}
            placeholder={t('dashboard.filters.searchPlaceholder')}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 320, fontFamily: 'var(--font-mono)', fontSize: 13 }}
          />
          <Select
            value={languageFilter}
            onChange={setLanguageFilter}
            options={languageOptions}
            style={{ width: 200 }}
          />
          <Select
            value={starsFilter}
            onChange={setStarsFilter}
            style={{ width: 190 }}
            options={[
              { value: 'all', label: t('dashboard.filters.allStars') },
              { value: 'gt0', label: t('dashboard.filters.starsGt0') },
              { value: 'gte100', label: t('dashboard.filters.starsGte100') },
              { value: 'gte1000', label: t('dashboard.filters.starsGte1000') },
            ]}
          />
          <Button
            onClick={() => {
              setSearchQuery('')
              setLanguageFilter('all')
              setStarsFilter('all')
            }}
          >
            {t('dashboard.filters.reset')}
          </Button>
        </div>

        <Table<Repository>
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          loading={isFetching}
          pagination={{ pageSize: 20, size: 'small' }}
          style={{ background: 'var(--bg-surface)', borderRadius: 8 }}
          className="repo-table"
          size="middle"
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <div
                style={{
                  padding: '40px 0',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                }}
              >
                {t('dashboard.table.empty')}
              </div>
            ),
          }}
        />
      </main>
    </div>
  )
}

