import { ActionPanel, Action, List, getPreferenceValues } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { parseOrgs } from "./orgs";
import { fetchRepositories } from "./gh";

export default function Command() {
  const { orgs } = getPreferenceValues<{ orgs: string }>();

  const { data, isLoading, error, revalidate } = useCachedPromise(
    (orgsString: string) => fetchRepositories(parseOrgs(orgsString)),
    [orgs],
    { initialData: [], onError: () => {} },
  );

  return (
    <List isLoading={isLoading}>
      {error ? (
        <List.EmptyView
          title="Failed to fetch repositories"
          description={`Check the Orgs / Users setting and run: gh auth status\n\n${error.message}`}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={revalidate} />
            </ActionPanel>
          }
        />
      ) : (
        data.map((repo) => (
          <List.Item
            key={repo.nameWithOwner}
            title={repo.name}
            subtitle={
              repo.description
                ? `${repo.nameWithOwner} — ${repo.description}`
                : repo.nameWithOwner
            }
            keywords={[repo.nameWithOwner]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={repo.url} />
                <Action.CopyToClipboard title="Copy URL" content={repo.url} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
