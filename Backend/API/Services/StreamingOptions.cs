namespace API.Services;

public sealed class StreamingOptions
{
    /// <summary>
    /// Si está activo, los ficheros con códecs compatibles (H.264 + AAC) se
    /// sirven directamente vía HTTP Range, sin pasar por FFmpeg. Si <c>false</c>,
    /// todo se transcodifica/remuxea a HLS como en el comportamiento original.
    /// </summary>
    public bool DirectPlayEnabled { get; set; } = true;
}
