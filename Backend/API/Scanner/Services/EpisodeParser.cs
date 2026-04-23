using System.Text.RegularExpressions;

namespace API.Scanner.Services;

internal static partial class EpisodeParser
{
    // Carpetas de temporada: T1, T01, T 1, Temporada 1, Temporada 01, Season 1, Season 01
    [GeneratedRegex(@"^(?:T(?:emporada)?|Season|Temporada)\s*0*(\d+)$", RegexOptions.IgnoreCase)]
    private static partial Regex SeasonFolderRegex();

    // Cap/Capítulo NNN — prioridad 1
    [GeneratedRegex(@"[\(\[]?Cap(?:[ií]tulo)?\.?\s*(\d)(\d{2})[\)\]]?", RegexOptions.IgnoreCase)]
    private static partial Regex CapRegex();

    // SxEE o SSxEE con o sin delimitadores — prioridad 2
    [GeneratedRegex(@"[\(\[]?(\d{1,2})x(\d{1,3})[\)\]]?", RegexOptions.IgnoreCase)]
    private static partial Regex SxEERegex();

    // Compacto NNN entre delimitadores — prioridad 3
    [GeneratedRegex(@"[\(\[](\d)(\d{2})[\)\]]")]
    private static partial Regex CompactDelimitedRegex();

    // Compacto NNN sin delimitadores — prioridad 4 (fallback)
    [GeneratedRegex(@"\b(\d)(\d{2})\b")]
    private static partial Regex CompactBareRegex();

    public static int? ParseSeasonFolder(string folderName)
    {
        var m = SeasonFolderRegex().Match(folderName.Trim());
        return m.Success && int.TryParse(m.Groups[1].Value, out var n) ? n : null;
    }

    public static (int Season, int Episode)? ParseEpisodeNumbers(string fileName)
    {
        var name = Path.GetFileNameWithoutExtension(fileName);

        var m = CapRegex().Match(name);
        if (m.Success && int.TryParse(m.Groups[1].Value, out var cs) && int.TryParse(m.Groups[2].Value, out var ce))
            return (cs, ce);

        m = SxEERegex().Match(name);
        if (m.Success && int.TryParse(m.Groups[1].Value, out var ss) && int.TryParse(m.Groups[2].Value, out var se))
            return (ss, se);

        m = CompactDelimitedRegex().Match(name);
        if (m.Success && int.TryParse(m.Groups[1].Value, out var ds) && int.TryParse(m.Groups[2].Value, out var de))
            return (ds, de);

        m = CompactBareRegex().Match(name);
        if (m.Success && int.TryParse(m.Groups[1].Value, out var bs) && int.TryParse(m.Groups[2].Value, out var be))
            return (bs, be);

        return null;
    }

    public static string ExtractEpisodeTitle(string fileName)
    {
        var name = Path.GetFileNameWithoutExtension(fileName);

        name = CapRegex().Replace(name, string.Empty);
        name = SxEERegex().Replace(name, string.Empty);
        name = CompactDelimitedRegex().Replace(name, string.Empty);
        name = Regex.Replace(name, @"[\.\-_]+", " ").Trim();
        name = Regex.Replace(name, @"\s{2,}", " ").Trim(" ()-[]".ToCharArray());

        return string.IsNullOrWhiteSpace(name) ? Path.GetFileNameWithoutExtension(fileName) : name;
    }
}
